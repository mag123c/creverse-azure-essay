import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { revisionQueueOptions } from './revision-queue.config';
import { RevisionConsumer } from './revision.consumer';
import { RevisionProducer } from './revision.producer';
import { RevisionsModule } from '@src/app/revisions/revisions.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.registerQueueAsync({
      name: 'submission-revision',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return revisionQueueOptions(config, 'submission-revision');
      },
    }),
    forwardRef(() => RevisionsModule),
  ],
  providers: [RevisionConsumer, RevisionProducer],
  exports: [RevisionProducer],
})
export class RevisionsQueueModule {}
