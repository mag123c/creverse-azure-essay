import { LoggingInterceptor } from '@src/common/interceptor/logging.interceptor';
import { HttpExceptionFilter } from '@src/common/filter/http-exception.filter';
import { Logger, UseFilters, UseInterceptors } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { SubmissionsService } from '@src/app/submissions/service/submissions.service';
import { Job } from 'bullmq';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';

@Processor('submission-evaluation')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class SubmissionConsumer extends WorkerHost {
  private readonly logger = new Logger(SubmissionConsumer.name);
  constructor(private readonly submissionsService: SubmissionsService) {
    super();
  }

  async process(job: Job<{ submissionId: number; videoPath?: string }>) {
    const { submissionId, videoPath } = job.data;

    this.logger.log(`${submissionId} 의 재평가를 시작합니다.(영상: ${videoPath ? videoPath : '없음'})`);

    await this.submissionsService.runEvaluationJob(submissionId, SubmissionLogAction.RETRY_SUBMISSION, videoPath);
  }

  async onActive(job: Job) {
    this.logger.log(`Job ${job.id} active`);
  }
  async onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }
  async onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed: ${err.message}`);
  }
}
