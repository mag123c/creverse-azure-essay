import { Injectable } from '@nestjs/common';
import { SubmissionsRequestDto } from '../dto/submissions-request.dto';
import { Submission } from '../domain/submission';
import { SubmissionEvaluator } from './submissions.evaluator';
import { SubmissionsResponseDto } from '../dto/submissions-response.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly evaluator: SubmissionEvaluator) {}

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
    _videoFile?: Express.Multer.File,
  ): Promise<SubmissionsResponseDto> {
    const submission = Submission.of(req.studentId, req.studentName, req.submitText);

    submission.markAsEvaluating();

    try {
      const evaluation = await this.evaluator.evaluate(submission);
      submission.applyEvaluation(evaluation);
      return submission.toDto();
    } catch (e) {
      submission.markAsFailed();
      throw e;
    }
  }
}
