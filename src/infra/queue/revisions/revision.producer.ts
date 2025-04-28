import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class RevisionProducer {
  private logger = new Logger(RevisionProducer.name);
  constructor(@InjectQueue('submission-revision') private readonly revisionQueue: Queue) {}

  /**
   *
   */
  async enqueueRevision(submissionId: number, videoPath?: string) {
    this.logger.log(`${submissionId} 의 수동 재평가 요청을 큐에 추가합니다. (영상: ${videoPath ? videoPath : '없음'})`);
    await this.revisionQueue.add(
      'submission-revision',
      { submissionId, videoPath },
      { jobId: `revision-${submissionId}` },
    );
  }

  getQueue() {
    return this.revisionQueue;
  }
}
