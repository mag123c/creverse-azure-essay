import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '@src/infra/azure/openai/service/openai.service';
import { Evaluation } from '../domain/evaluation';
import { Submission } from '../domain/submission';

@Injectable()
export class SubmissionEvaluator {
  private readonly logger = new Logger(SubmissionEvaluator.name);

  constructor(private readonly openAI: OpenAIService) {}

  async evaluate(submission: Submission): Promise<Evaluation> {
    this.logger.log(`학생 ${submission.getStudentName()}(${submission.getStudentId()}) 평가 시작`);

    const start = Date.now();
    const result = await this.openAI.evaluate(submission.getSubmitText());

    const latency = Date.now() - start;
    this.logger.log(`학생 ${submission.getStudentId()} 평가 완료 (${latency}ms)`);

    return new Evaluation(result.score, result.feedback, result.highlights);
  }
}
