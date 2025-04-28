import { forwardRef, Module } from '@nestjs/common';
import { SubmissionsService } from './service/submissions.service';
import { OpenAIModule } from '@src/infra/azure/openai/openai.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionEvaluator } from './service/submissions.evaluator';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsEntity } from './entities/submissions.entity';
import { SubmissionLogsEntity } from './entities/submission-logs.entity';
import { SubmissionMediaEntity } from './entities/submission-media.entity';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { SubmissionLogsRepository } from './repositories/submission-logs.repository';
import { SubmissionMediaUploader } from './uploader/submission-media-uploader';
import { BlobStorageModule } from '@src/infra/azure/blob/blob.module';
import { SubmissionMediaRepository } from './repositories/submission-media.repository';
import { SubmissionQueueModule } from '@src/infra/queue/submissions/submission-queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubmissionsEntity, SubmissionLogsEntity, SubmissionMediaEntity]),
    OpenAIModule,
    BlobStorageModule,
    forwardRef(() => SubmissionQueueModule),
  ],
  providers: [
    SubmissionsService,
    SubmissionEvaluator,
    SubmissionMediaUploader,

    SubmissionsRepository,
    SubmissionLogsRepository,
    SubmissionMediaRepository,
  ],
  exports: [SubmissionsService, SubmissionEvaluator, SubmissionMediaUploader],
  controllers: [SubmissionsController],
})
export class SubmissionsModule {}
