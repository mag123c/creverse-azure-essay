import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '@src/infra/azure/openai/service/openai.service';
import { Evaluation } from '../domain/evaluation';
import { Submission } from '../domain/submission';

@Injectable()
export class SubmissionEvaluator {
  private readonly logger = new Logger(SubmissionEvaluator.name);

  constructor(private readonly openAI: OpenAIService) {}

  async evaluate(submission: Submission): Promise<void> {
    this.logger.log(`학생 ${submission.getStudentName()}(${submission.getStudentId()}) 평가 시작`);

    const start = Date.now();

    try {
      const result = await this.openAI.evaluate(submission.getSubmitText());
      result.setLatency(Date.now() - start);
      this.logger.log(`학생 ${submission.getStudentId()} 평가 완료`);
      submission.applyEvaluation(result);
      return;
    } catch (e: any) {
      submission.applyEvaluationFailed(Evaluation.of(0, '', [], Date.now() - start));
      this.logger.error(`학생 ${submission.getStudentId()} 평가 실패: ${e.message}`, e.stack);
      throw e;
    }
  }
}
