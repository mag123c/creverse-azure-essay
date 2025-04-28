import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { revisionQueueOptions } from './revision-queue.config';
import { RevisionConsumer } from './revision.consumer';
import { RevisionProducer } from './revision.producer';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.registerQueueAsync({
      name: 'revision',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return revisionQueueOptions(config, 'revision');
      },
    }),
    forwardRef(() => RevisionsQueueModule),
  ],
  providers: [RevisionConsumer, RevisionProducer],
  exports: [RevisionProducer],
})
export class RevisionsQueueModule {}
