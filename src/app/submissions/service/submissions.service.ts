import { Injectable } from '@nestjs/common';
import { SubmissionsRequestDto } from '../dto/submissions-request.dto';
import { Submission, SubmissionStatus } from '../domain/submission';
import { SubmissionEvaluator } from './submissions.evaluator';
import { SubmissionsResponseDto } from '../dto/submissions-response.dto';
import { Transactional } from 'typeorm-transactional';
import { SubmissionsRepository } from '../repositories/submissions.repository';
import { DuplicateSubmissionException } from '../exception/submissions.exception';
import { generateTraceId } from '@src/common/utils/crpyto';
import { SubmissionsEntity } from '../entities/submissions.entity';
import { SubmissionLogsRepository } from '../repositories/submission-logs.repository';
import { SubmissionLogAction } from '../entities/submission-logs.entity';
import { SubmissionMediaUploader } from '../uploader/submission-media-uploader';
import { SubmissionMediaRepository } from '../repositories/submission-media.repository';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly evaluator: SubmissionEvaluator,
    private readonly uploader: SubmissionMediaUploader,

    private readonly submissionsRepository: SubmissionsRepository,
    private readonly submissionLogsRepository: SubmissionLogsRepository,
    private readonly submissionMediaRepository: SubmissionMediaRepository,
  ) {}

  /**
   * @API POST /v1/submissions - 학생 에세이 제출 (AI 평가 요청)
   * @description
   *   학생의 영어 에세이를 제출하여 AI 평가를 요청하고, 결과를 반환합니다.
   *   - 파일 업로드가 포함된 경우, 'multipart/form-data' 형식으로 요청되어야 하며 영상 파일이 포함됩니다.
   *   - 파일이 없는 경우, 'application/json' 형식으로 요청할 수 있습니다.
   *   - 학생 1명당 동일한 컴포넌트 타입(componentType)은 1회만 제출 가능합니다. 이미 해당 타입으로 평가가 완료된 경우, 중복 제출은 허용되지 않습니다.   *
   *
   */
  async generateSubmissionFeedback(
    req: SubmissionsRequestDto,
    videoFile?: Express.Multer.File,
  ): Promise<SubmissionsResponseDto> {
    const start = Date.now();

    // 1. 중복된 컴포넌트 타입의 제출이 있다면 예외처리
    if (await this.isDuplicateSubmission(req.studentId, req.componentType)) {
      throw new DuplicateSubmissionException(req.studentId, req.componentType);
    }

    // 2. 중복된 컴포넌트 타입의 제출이 없다면, 평가 요청 저장
    const savedSubmissionEntity = await this.saveIntializeSubmission(req);
    const submission = Submission.ofEntity(savedSubmissionEntity);

    try {
      // 3. 영상 파일이 있는 경우, 영상 처리 및 업로드
      // 4. 평가 요청
      const [mediaResult, evalResult] = await Promise.allSettled([
        this.uploader.upload(videoFile),
        this.evaluator.evaluate(submission),
      ]);

      if (mediaResult.status === 'fulfilled' && mediaResult.value) {
        submission.setMedia(mediaResult.value);
      }
      if (evalResult.status === 'fulfilled') {
        submission.applyEvaluation(evalResult.value);
      } else {
        throw evalResult.reason;
      }

      return submission.toDto();
    } catch (e: any) {
      submission.markAsFailed(e.message);
      throw e;
    } finally {
      // 5. 평가 결과 저장
      if (submission) {
        submission.setLatency(Date.now() - start);
        await this.saveSubmissionResult(submission, 'INITIAL');
      }
    }
  }

  /**
   * 평가 요청 시 평가와 로그 최초 생성
   */
  @Transactional()
  async saveIntializeSubmission(req: SubmissionsRequestDto): Promise<SubmissionsEntity> {
    const submissionEntity = this.submissionsRepository.create({
      student: { id: req.studentId },
      componentType: req.componentType,
      submitText: req.submitText,
      highlightSubmitText: '',
      feedback: '',
      highlights: [],
      status: SubmissionStatus.EVALUATING,
      traceId: generateTraceId(),
    });

    // 최초 제출 저장
    const savedSubmissionEntity = await this.submissionsRepository.save(submissionEntity);

    const submissionLogEntity = this.submissionLogsRepository.create({
      submission: savedSubmissionEntity,
      action: 'INITIAL',
      status: SubmissionStatus.EVALUATING,
      traceId: generateTraceId(),
      payload: { request: req },
    });

    // 최초 제출 로그 저장
    await this.submissionLogsRepository.save(submissionLogEntity);
    submissionEntity.logs = [submissionLogEntity];
    return savedSubmissionEntity;
  }

  /**
   * 평가 결과 저장.
   */
  @Transactional()
  async saveSubmissionResult(submission: Submission, action: SubmissionLogAction): Promise<void> {
    const submissionEntity = this.submissionsRepository.create({
      id: submission.getId(),
      student: { id: submission.getStudentId(), name: submission.getStudentName() },
      componentType: submission.getComponentType(),
      submitText: submission.getSubmitText(),
      highlightSubmitText: submission.getHighlightSubmitText(),
      score: submission.getEvaluation()?.score,
      feedback: submission.getEvaluation()?.feedback,
      highlights: submission.getEvaluation()?.highlights,
      mediaUrl: submission.getMedia(),
      status: submission.getStatus(),
      apiLatency: submission.getApiLatency(),
      traceId: submission.getTraceId(),
    });

    const submissionLogEntity = this.submissionLogsRepository.create({
      submission: submissionEntity,
      action,
      status: submission.getStatus(),
      apiLatency: submission.getApiLatency(),
      traceId: submission.getTraceId(),
      payload: { response: submission.toDto() },
    });

    await this.submissionsRepository.save(submissionEntity);
    await this.submissionLogsRepository.save(submissionLogEntity);

    if (submission.getMedia()) {
      const mediaEntity = this.submissionMediaRepository.create({
        submission: submissionEntity,
        videoUrl: submission.getMedia()?.getVideoUrl(),
        audioUrl: submission.getMedia()?.getAudioUrl(),
        meta: submission.getMedia()?.getMeta(),
      });
      await this.submissionMediaRepository.save(mediaEntity);
    }
  }

  /**
   * @internal 중복된 제출이 있는지
   */
  private async isDuplicateSubmission(studentId: number, componentType: string): Promise<boolean> {
    const submission = await this.submissionsRepository.findDuplicateSubmission(studentId, componentType);
    return submission !== null;
  }
}
