import { Injectable, Logger } from '@nestjs/common';
import { Student } from '@src/app/students/domain/student';
import { SubmissionsService } from '@src/app/submissions/service/submissions.service';
import { RevisionsRepository } from '../repositories/revisions.repository';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import { RevisionProducer } from '@src/infra/queue/revisions/revision.producer';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';
import { SubmissionDetailItem } from '@src/app/submissions/dto/submissions-response.dto';
import { GetRevisionsRequestDto } from '../dto/revisions-request.dto';
import { GetRevisionsResponseDto, RevisionDetailResponseDto } from '../dto/revisions-response.dto';
import { RevisionsEntity } from '../entities/revisions.entity';
import { OffsetPaginateResult } from '@src/common/pagination/pagination.interface';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { AlreadyEvaluatingException, RevisionsNotFoundException } from '../exception/revisions.exception';
import { Transactional } from 'typeorm-transactional';
import { EvaluationStats } from '@src/app/stats/interface/stats.interface';

@Injectable()
export class RevisionsService {
  private readonly logger = new Logger(RevisionsService.name);
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly revisionProducer: RevisionProducer,
    private readonly revisionsRepository: RevisionsRepository,
  ) {}

  /**
   * @API GET /v1/revisions
   * @description
   *  학생이 제출한 에세이의 (수동) 재평가 내역을 조회합니다.
   *    - 필터: 상태
   *    - 정렬: 생성일자 DESC
   */
  async getRevisions(student: Student, req: GetRevisionsRequestDto): Promise<GetRevisionsResponseDto> {
    const revisionssWithPagination: OffsetPaginateResult<RevisionsEntity> =
      await this.revisionsRepository.findStudentRevisionsWithPagination(student.id, { ...req });

    return GetRevisionsResponseDto.of(revisionssWithPagination.data, revisionssWithPagination.meta);
  }

  /**
   * @API GET /v1/revisions/:revisionId
   * @description
   *  학생이 제출한 에세이의 (수동) 재평가 상세 내역을 조회합니다.
   */
  async getRevisionDetail(student: Student, revisionId: number): Promise<RevisionDetailResponseDto> {
    const revision = await this.revisionsRepository.findStudentRevisionDetail(revisionId);
    if (!revision) {
      throw new RevisionsNotFoundException(revisionId);
    }

    return RevisionDetailResponseDto.of({
      ...revision,
      submissionId: revision.submission.id,
      studentId: student.id,
      studentName: student.name,
      mediaUrl: revision.submission.media
        ? { video: revision.submission.media.videoUrl, audio: revision.submission.media.audioUrl }
        : undefined,
    });
  }

  /**
   * @API POST /v1/revisions
   * @description
   * 재평가 요청
   *  - 재평가를 요청하면, 큐에 작업이 추가됩니다.
   */
  @Transactional()
  async revisionSubmission(student: Student, submissionId: number): Promise<ApiSuccessResponse<undefined>> {
    this.logger.log(`[${student.id}] ${student.name} 학생이 ${submissionId}번 에세이에 대한 재평가 요청.`);

    const submission = await this.submissionsService.getOneOrThrow(submissionId);
    if (submission.status === SubmissionStatus.EVALUATING) {
      throw new AlreadyEvaluatingException(submission.id);
    }

    // 재평가 요청 상태로 변경
    await this.submissionsService.markRevision(submission);

    // 재평가 요청 저장
    await this.revisionsRepository.save({
      submission: { id: submissionId },
      status: SubmissionStatus.EVALUATING,
      componentType: submission.componentType,
      submitText: submission.submitText,
      highlightSubmitText: submission.highlightSubmitText,
      score: submission.score,
      highlights: submission.highlights,
      feedback: submission.feedback,
    });

    // 재평가 요청 큐에 추가
    await this.revisionProducer.enqueueRevision(submissionId);
    return {
      result: 'ok',
      message: null,
      apiLatency: 0, // 인터셉터에 의해 자동으로 설정됨
    };
  }

  /**
   * 재평가 작업을 실행합니다.
   */
  async runRevisionJob(submissionId: number, action: SubmissionLogAction.REVISION_SUBMISSION, videoPath?: string) {
    // 재평가 실행
    const revisionResult = await this.submissionsService.runEvaluationJob(submissionId, action, videoPath);

    // 재평가 결과 저장
    await this.saveRevisionResult(submissionId, revisionResult.data);
  }

  private async saveRevisionResult(submissionId: number, revisionResult: SubmissionDetailItem) {
    await this.revisionsRepository.save({
      submission: { id: submissionId },
      status: revisionResult.status,
      componentType: revisionResult.componentType,
      submitText: revisionResult.submitText,
      highlightSubmitText: revisionResult.highlightSubmitText,
      score: revisionResult.score,
      feedback: revisionResult.feedback,
      highlights: revisionResult.highlights,
    });
  }

  /**
   * 재평가에 대한 총 통계
   */
  async computeEvaluationStatusByDate(startDate: string, endDate: string): Promise<EvaluationStats> {
    const result = await this.revisionsRepository.computeEvaluationStatusByDate(startDate, endDate);
    return {
      totalCount: Number(result?.totalCount ?? 0),
      successCount: Number(result?.successCount ?? 0),
      failedCount: Number(result?.failedCount ?? 0),
    };
  }
}
