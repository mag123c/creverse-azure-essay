import { Injectable } from '@nestjs/common';
import { Student } from '@src/app/students/domain/student';
import { SubmissionsService } from '@src/app/submissions/service/submissions.service';
import { RevisionsRepository } from '../repositories/revisions.repository';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import { RevisionProducer } from '@src/infra/queue/revisions/revision.producer';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { SubmissionDetailItem } from '@src/app/submissions/dto/submissions-response.dto';

@Injectable()
export class RevisionsService {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly revisionProducer: RevisionProducer,
    private readonly revisionsRepository: RevisionsRepository,
  ) {}
  /**
   * @API POST /v1/revisions
   * @description
   * 재평가 요청
   *  - 재평가를 요청하면, 큐에 작업이 추가됩니다.
   */
  async revisionSubmission(student: Student, submissionId: number): Promise<ApiSuccessResponse<undefined>> {
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
    const previousSubmissionStatus: SubmissionStatus = await this.submissionsService.getSubmissionStatus(submissionId);
    const revisionResult = await this.submissionsService.runEvaluationJob(submissionId, action, videoPath);

    // 재평가 결과 저장
    await this.saveRevisionResult(submissionId, previousSubmissionStatus, revisionResult.data);
  }

  private async saveRevisionResult(
    submissionId: number,
    previousSubmissionStatus: SubmissionStatus,
    revisionResult: SubmissionDetailItem,
  ) {
    await this.revisionsRepository.save({
      submissionId,
      previousSubmissionStatus,
      revisionResult,
      componentType: revisionResult.componentType,
      submitText: revisionResult.submitText,
      highlightSubmitText: revisionResult.highlightSubmitText,
      score: revisionResult.score,
      feedback: revisionResult.feedback,
      highlights: revisionResult.highlights,
      mediaUrl: revisionResult.mediaUrl,
    });
  }
}
