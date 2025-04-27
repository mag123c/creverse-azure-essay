import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class SubmissionProducer {
  private logger = new Logger(SubmissionProducer.name);
  constructor(@InjectQueue('submission-evaluation') private readonly submissionQueue: Queue) {}

  /**
   *
   */
  async enqueueSubmissionEvaluation(submissionId: number, videoPath?: string) {
    this.logger.log(`${submissionId} 의 재평가 요청을 큐에 추가합니다. (영상: ${videoPath ? videoPath : '없음'})`);
    await this.submissionQueue.add(
      'evaluate-and-upload',
      { submissionId, videoPath },
      { jobId: `submission-${submissionId}`, delay: 60 * 60 * 3600 }, // 1시간 대기
    );
  }

  getQueue() {
    return this.submissionQueue;
  }
}
