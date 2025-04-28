import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';
import { SubmissionConsumer } from './submission.consumer';
import { SubmissionProducer } from './submission.producer';
import { submissionQueueOptions } from './submission-queue.config';

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
export class SubmissionQueueModule {}
