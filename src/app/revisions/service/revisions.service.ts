import { Injectable, Logger } from '@nestjs/common';
import { Student } from '@src/app/students/domain/student';
import { SubmissionsService } from '@src/app/submissions/service/submissions.service';
import { RevisionsRepository } from '../repositories/revisions.repository';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import { SubmissionDetailItem } from '@src/app/submissions/dto/submissions-response.dto';
import { GetRevisionsRequestDto } from '../dto/revisions-request.dto';
import { GetRevisionsResponseDto, RevisionDetailResponseDto } from '../dto/revisions-response.dto';
import { RevisionsEntity } from '../entities/revisions.entity';
import { OffsetPaginateResult } from '@src/common/pagination/pagination.interface';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { AlreadyEvaluatingException, RevisionsNotFoundException } from '../exception/revisions.exception';
import { EvaluationStats } from '@src/app/stats/interface/stats.interface';

@Injectable()
export class RevisionsService {
  private readonly logger = new Logger(RevisionsService.name);
  constructor(
    private readonly submissionsService: SubmissionsService,
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
      id: revision.id,
      submissionId: revision.submission.id,
      studentId: student.id,
      studentName: student.name,
      componentType: revision.componentType,
      status: revision.status,
      submitText: revision.submitText,
      createdDt: revision.createdDt,
      score: revision.score,
      feedback: revision.feedback,
      highlights: revision.highlights,
      highlightSubmitText: revision.highlightSubmitText,
    });
  }

  /**
   * @API POST /v1/revisions
   * @description
   * 재평가 요청
   *  - 재평가를 요청하면, 재평가 등록 및 평가 로직을 한 번 더 수행합니다.
   */
  async revisionSubmission(student: Student, submissionId: number): Promise<RevisionDetailResponseDto> {
    this.logger.log(`[${student.id}] ${student.name} 학생이 ${submissionId}번 에세이에 대한 재평가 요청.`);

    const submission = await this.submissionsService.getOneOrThrow(submissionId);
    if (submission.status === SubmissionStatus.EVALUATING) {
      throw new AlreadyEvaluatingException(submission.id);
    }

    // 재평가 요청 상태로 변경
    await this.submissionsService.markRevision(submission);

    // 재평가 요청 저장
    const revision = await this.revisionsRepository.save({
      submission: { id: submissionId },
      status: SubmissionStatus.EVALUATING,
      componentType: submission.componentType,
      submitText: submission.submitText,
      highlightSubmitText: submission.highlightSubmitText,
      score: submission.score,
      highlights: submission.highlights,
      feedback: submission.feedback,
    });

    try {
      // 재평가 결과
      const revisionResult = await this.submissionsService.runEvaluationJob(
        submissionId,
        SubmissionLogAction.REVISION_SUBMISSION,
      );

      // 재평가 결과 저장
      await this.saveRevisionResult(revision, revisionResult.data);

      return RevisionDetailResponseDto.of({
        id: revision.id,
        submissionId: revision.submission.id,
        studentId: student.id,
        studentName: student.name,
        componentType: revision.componentType,
        status: revision.status,
        submitText: revision.submitText,
        createdDt: revision.createdDt,
        score: revision.score,
        feedback: revision.feedback,
        highlights: revision.highlights,
        highlightSubmitText: revision.highlightSubmitText,
      });
    } catch (e: any) {
      this.logger.error(
        `[${student.id}] ${student.name} 학생의 ${submissionId}번 재평가 요청 중 오류 발생: ${e.message}`,
        e.stack,
      );
      await this.revisionsRepository.update(revision.id, {
        status: SubmissionStatus.FAILED,
      });
      throw e;
    }
  }

  /**
   * 재평가 결과 저장
   */
  private async saveRevisionResult(revision: RevisionsEntity, revisionResult: SubmissionDetailItem) {
    await this.revisionsRepository.update(revision.id, {
      status: revisionResult.status,
      score: revisionResult.score,
      feedback: revisionResult.feedback,
      highlights: revisionResult.highlights,
      highlightSubmitText: revisionResult.highlightSubmitText,
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
