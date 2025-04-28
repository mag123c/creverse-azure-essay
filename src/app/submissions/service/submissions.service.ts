import { Injectable, Logger } from '@nestjs/common';
import { CreateSubmissionsRequestDto, GetSubmissionsRequestDto } from '../dto/submissions-request.dto';
import { Submission, SubmissionStatus } from '../domain/submission';
import { SubmissionEvaluator } from './submissions.evaluator';
import { SubmissionsRepository } from '../repositories/submissions.repository';
import {
  AlreadyEvaluatedException,
  AlreadyRevisedSubmissionException,
  DuplicateSubmissionException,
  SubmissionNotFoundException,
} from '../exception/submissions.exception';
import { SubmissionMediaUploader } from '../uploader/submission-media-uploader';
import { Student } from '@src/app/students/domain/student';
import { SubmissionProducer } from '@src/infra/queue/submissions/submission.producer';
import { SubmissionLogAction, SubmissionLogsEntity } from '../entities/submission-logs.entity';
import { SubmissionLogsRepository } from '../repositories/submission-logs.repository';
import { SubmissionMediaRepository } from '../repositories/submission-media.repository';
import { SubmissionsEntity } from '../entities/submissions.entity';
import { Transactional } from 'typeorm-transactional';
import { OffsetPaginateResult } from '@src/common/pagination/pagination.interface';
import { GetSubmissionsResponseDto, SubmissionDetailResponseDto } from '../dto/submissions-response.dto';
import { RevisionDetailItem } from '@src/app/revisions/dto/revisions-response.dto';
import { EvaluationStats } from '@src/app/stats/interface/stats.interface';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly evaluator: SubmissionEvaluator,
    private readonly uploader: SubmissionMediaUploader,
    private readonly submissionProducer: SubmissionProducer,

    private readonly submissionsRepository: SubmissionsRepository,
    private readonly submissionLogsRepository: SubmissionLogsRepository,
    private readonly submissionMediaRepository: SubmissionMediaRepository,
  ) {}

  /**
   * @API GET /v1/submissions - 학생 에세이 제출 내역 조회
   * @description
   *  학생이 제출한 에세이의 제출 내역을 조회합니다.
   *    - 필터: 상태
   *    - 정렬: 생성일자 DESC
   */
  async getSubmissions(student: Student, req: GetSubmissionsRequestDto): Promise<GetSubmissionsResponseDto> {
    const submissionsWithPagination: OffsetPaginateResult<SubmissionsEntity> =
      await this.submissionsRepository.findStudentSubmissionsWithPagination(student.id, { ...req });

    return GetSubmissionsResponseDto.of(submissionsWithPagination.data, submissionsWithPagination.meta);
  }

  /**
   * @API GET /v1/submissions/:submissionId - 학생 에세이 제출 상세 조회
   * @description
   *  학생이 제출한 에세이의 상세 내역을 조회합니다.
   */
  async getSubmissionDetail(student: Student, submissionId: number): Promise<SubmissionDetailResponseDto> {
    const submission = await this.submissionsRepository.findStudentSubmissionDetail(submissionId);
    if (!submission) {
      throw new SubmissionNotFoundException(submissionId);
    }

    return SubmissionDetailResponseDto.of({
      ...submission,
      studentId: student.id,
      studentName: student.name,
      mediaUrl: submission.media ? { video: submission.media.videoUrl, audio: submission.media.audioUrl } : undefined,
      revisions: submission.revisions?.map((revision) => RevisionDetailItem.of({ ...revision, submission })),
    });
  }

  /**
   * @API POST /v1/submissions - 학생 에세이 제출 (AI 평가 요청)
   * @description
   *   학생의 영어 에세이를 제출하여 AI 평가를 요청합니다.
   *   - 파일 업로드가 포함된 경우, 'multipart/form-data' 형식으로 요청되어야 하며 영상 파일이 포함됩니다.
   *   - 파일이 없는 경우, 'application/json' 형식으로 요청할 수 있습니다.
   *   - 학생 1명당 동일한 컴포넌트 타입(componentType)은 1회만 제출 가능합니다. 이미 해당 타입으로 평가가 완료된 경우, 중복 제출은 허용되지 않습니다.
   *   - 평가 실패 시 영상 처리 및 평가 요청이 메세지 큐에 등록됩니다.
   *
   */
  async generateSubmissionFeedback(
    student: Student,
    req: CreateSubmissionsRequestDto,
    videoFile?: Express.Multer.File,
  ) {
    this.logger.log(`[${student.id}] ${student.name} 학생이  - 컴포넌트 ${req.componentType} 제출 시작`);

    // 중복된 컴포넌트 타입의 제출이 있다면 예외처리
    await this.isDuplicateSubmission(student.id, req.componentType);
    if (await this.isDuplicateSubmission(student.id, req.componentType)) {
      throw new DuplicateSubmissionException(student.id, req.componentType);
    }

    // 평가 전으로 등록
    const entity = await this.createPending(student, req);
    return await this.evaluateSubmission(entity.id, SubmissionLogAction.INITIALIZE_SUBMISSION, videoFile?.path);
  }

  /**
   * 컨슈머에서 호출되는 평가 요청
   */
  async runEvaluationJob(submissionId: number, action: SubmissionLogAction, videoPath?: string) {
    return await this.evaluateSubmission(submissionId, action, videoPath);
  }

  /**
   * 평가 수행 로직
   *  - 영상 업로드는 성공/실패 여부를 따지지 않음.
   *  - 평가 요청은 성공/실패 여부를 따져 예외처리 및 최초라면 큐에 적재.
   */
  private async evaluateSubmission(submissionId: number, action: SubmissionLogAction, videoPath?: string) {
    this.logger.log(`제출 ID ${submissionId} - 평가 시작 (Action: ${action})`);

    const existsSubmission = await this.submissionsRepository.findOneWithRevisionLog(submissionId);
    if (!existsSubmission) {
      throw new SubmissionNotFoundException(submissionId);
    }

    // 기존 평가가 실패한 게 아닌 경우 (메시지큐의 재요청 시)
    if (existsSubmission.status !== SubmissionStatus.PENDING && existsSubmission.status !== SubmissionStatus.FAILED) {
      throw new AlreadyEvaluatedException(submissionId);
    }

    // 재평가 시도가 있었던 경우 (제출 최초 실패에 의한 메시지큐의 재요청 시, 수동(REVISION)은 제외)
    if (action === SubmissionLogAction.RETRY_SUBMISSION && existsSubmission.logs && existsSubmission.logs.length > 0) {
      throw new AlreadyRevisedSubmissionException(submissionId);
    }

    const submission = Submission.ofEntity(existsSubmission);

    // 평가 중으로 업데이트
    await this.markEvaluating(submissionId);

    try {
      // 평가 안에 상태 변경은 각 메서드에서 처리
      const [, evaluate] = await Promise.allSettled([
        this.uploader.upload(submission, videoPath), // 영상 파일이 있는 경우, 영상 처리 및 업로드
        this.evaluator.evaluate(submission), // 평가 요청
      ]);

      // 평가 실패 시 예외처리
      if (evaluate.status !== 'fulfilled') {
        throw evaluate.reason;
      }

      await this.saveSubmissionResult(existsSubmission, submission, action);
      return submission.toDto();
    } catch (e: any) {
      this.logger.error(`제출 ID ${submissionId} 평가 실패: ${e.message}`, e.stack);

      submission.markAsFailed();
      await this.saveSubmissionResult(existsSubmission, submission, action);
      // 최초 평가 실패 시 큐에 적재
      if (action === SubmissionLogAction.INITIALIZE_SUBMISSION) {
        await this.submissionProducer.enqueueSubmissionEvaluation(submissionId, videoPath);
      }
      throw e;
    }
  }

  /**
   * 중복된 제출이 있는지
   */
  private async isDuplicateSubmission(studentId: number, componentType: string): Promise<boolean> {
    const submission = await this.submissionsRepository.findOneByStudentIdAndComponentType(studentId, componentType);
    return submission !== null;
  }

  /**
   * 평가 최초 생성
   */
  @Transactional()
  private async createPending(student: Student, dto: CreateSubmissionsRequestDto): Promise<SubmissionsEntity> {
    const submissionEntity = await this.submissionsRepository.save(
      this.submissionsRepository.create({
        student: { id: student.id },
        componentType: dto.componentType,
        submitText: dto.submitText,
        status: SubmissionStatus.PENDING,
      }),
    );

    const submissionLogEntity = this.createSubmissionLog(
      submissionEntity,
      SubmissionLogAction.INITIALIZE_SUBMISSION,
      SubmissionStatus.PENDING,
      0,
    );
    await this.submissionLogsRepository.save(submissionLogEntity);
    submissionEntity.logs = [submissionLogEntity];
    return submissionEntity;
  }

  /**
   * 평가 중으로 업데이트
   */
  @Transactional()
  private async markEvaluating(id: number) {
    const submissionEntity = await this.submissionsRepository.findOneBySubmissionId(id);
    if (!submissionEntity) {
      throw new SubmissionNotFoundException(id);
    }

    submissionEntity.status = SubmissionStatus.EVALUATING;

    await Promise.all([
      this.submissionsRepository.save(submissionEntity),
      this.submissionLogsRepository.save(
        this.createSubmissionLog(
          submissionEntity,
          SubmissionLogAction.INITIALIZE_SUBMISSION,
          SubmissionStatus.EVALUATING,
          0,
        ),
      ),
    ]);
  }

  /**
   * 평가 완료 후 저장
   */
  @Transactional()
  private async saveSubmissionResult(
    existsEntity: SubmissionsEntity,
    submission: Submission,
    action: SubmissionLogAction,
  ) {
    const submissionLogs = [];

    // 평가 로그
    const latency = submission.getEvaluation()?.getLatency() ?? 0;
    const submissionLog = this.createSubmissionLog(existsEntity, action, submission.getStatus()!, latency);
    submissionLogs.push(submissionLog);

    // 영상 처리 저장
    const media = submission.getMedia();
    if (media) {
      const mediaStatus =
        media.getVideoUrl() && media.getAudioUrl() ? SubmissionStatus.SUCCESS : SubmissionStatus.FAILED;
      const mediaLatency = media.getLatency();
      const mediaLog = this.createSubmissionLog(
        existsEntity,
        SubmissionLogAction.MEDIA_UPLOAD,
        mediaStatus,
        mediaLatency,
      );

      submissionLogs.push(mediaLog);

      // 영상 처리 결과 저장
      if (mediaStatus === SubmissionStatus.SUCCESS) {
        await this.submissionMediaRepository.save({
          submission: existsEntity,
          videoUrl: media.getVideoUrl(),
          audioUrl: media.getAudioUrl(),
          meta: media.getMeta(),
        });
      }
    }

    // 평가 결과 + 로그 저장
    await this.submissionsRepository.update(existsEntity.id, {
      highlightSubmitText: submission.getHighlightSubmitText(),
      score: submission.getEvaluation()?.getScore(),
      feedback: submission.getEvaluation()?.getFeedback(),
      highlights: submission.getEvaluation()?.getHighlights(),
      status: submission.getStatus()!,
    });
    await this.submissionLogsRepository.save(submissionLogs);
  }

  /**
   * 로그 생성
   */
  private createSubmissionLog(
    submissionEntity: SubmissionsEntity,
    action: SubmissionLogAction,
    status: SubmissionStatus,
    latency: number,
  ): SubmissionLogsEntity {
    return this.submissionLogsRepository.create({
      action,
      status,
      latency,
      submission: submissionEntity,
    });
  }

  /**
   * 수동 재평가 시 상태 변경
   */
  @Transactional()
  async markRevision(submissionEntity: SubmissionsEntity) {
    submissionEntity.status = SubmissionStatus.EVALUATING;

    await Promise.all([
      this.submissionsRepository.save(submissionEntity),
      this.submissionLogsRepository.save(
        this.createSubmissionLog(
          submissionEntity,
          SubmissionLogAction.REVISION_SUBMISSION,
          SubmissionStatus.EVALUATING,
          0,
        ),
      ),
    ]);
  }

  async getOneOrThrow(submissionId: number): Promise<SubmissionsEntity> {
    const submission = await this.submissionsRepository.findOneBySubmissionId(submissionId);
    if (!submission) {
      throw new SubmissionNotFoundException(submissionId);
    }
    return submission;
  }

  /**
   * 기간별 총, 성공, 실패 통계
   */
  async computeEvaluationStatusByDate(startDate: string, endDate: string): Promise<EvaluationStats> {
    const result = await this.submissionsRepository.computeEvaluationStatusByDate(startDate, endDate);
    return {
      totalCount: Number(result?.totalCount ?? 0),
      successCount: Number(result?.successCount ?? 0),
      failedCount: Number(result?.failedCount ?? 0),
    };
  }
}
