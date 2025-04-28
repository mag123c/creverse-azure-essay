import { LoggingInterceptor } from '@src/common/interceptor/logging.interceptor';
import { HttpExceptionFilter } from '@src/common/filter/http-exception.filter';
import { Logger, UseFilters, UseInterceptors } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import * as fs from 'fs/promises';
import { RevisionsService } from '@src/app/revisions/service/revisions.service';

@Processor('submission-revision')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class RevisionConsumer extends WorkerHost {
  private readonly logger = new Logger(RevisionConsumer.name);
  constructor(private readonly revisionsService: RevisionsService) {
    super();
  }

  async process(job: Job<{ submissionId: number; videoPath?: string }>) {
    const { submissionId, videoPath } = job.data;

    this.logger.log(`${submissionId} 의 수동 재평가를 시작합니다.(영상: ${videoPath ? videoPath : '없음'})`);

    try {
      await this.revisionsService.runRevisionJob(submissionId, SubmissionLogAction.REVISION_SUBMISSION, videoPath);
    } catch (e: any) {
      this.logger.error(`학생 ${submissionId} 평가 실패: ${e.message}`, e.stack);
      throw e;
    } finally {
      // 업로드된 파일 삭제
      if (videoPath) {
        try {
          await fs.unlink(videoPath);
          this.logger.log(`수동 재평가 후 원본 파일 삭제 완료: ${videoPath}`);
        } catch (err: any) {
          this.logger.error(`수동 재평가 후 원본 파일 삭제 실패 (${videoPath}): ${err.message}`);
        }
      }
    }
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
