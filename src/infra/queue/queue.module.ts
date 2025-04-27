import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { submissionQueueOptions } from './queue.config';
import { SubmissionConsumer } from './submissions/submission.consumer';
import { SubmissionProducer } from './submissions/submission.producer';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.registerQueueAsync({
      name: 'submission-evaluation',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return submissionQueueOptions(config, 'submission-evaluation');
      },
    }),
    forwardRef(() => SubmissionsModule),
  ],
  providers: [SubmissionConsumer, SubmissionProducer],
  exports: [SubmissionProducer],
})
export class QueueModule {}
