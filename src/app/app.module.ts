import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/logging/logger.module';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from '@src/config';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { OpenAIModule } from '@src/infra/azure/openai/openai.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { StudentsModule } from './students/students.module';
import { BlobStorageModule } from '@src/infra/azure/blob/blob.module';
import { AuthModule } from './auth/auth.module';
import { SubmissionQueueModule } from '@src/infra/queue/submissions/submission-queue.module';
import { RevisionsQueueModule } from '@src/infra/queue/revisions/revision-queue.module';
import { RevisionsModule } from './revisions/revisions.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    // Default Setting
    ConfigModule.forRoot({
      ...envConfig(),
    }),
    LoggerModule,

    // Infra
    CustomDatabaseModule,
    BlobStorageModule,
    OpenAIModule,
    SubmissionQueueModule,
    RevisionsQueueModule,
    StatsModule,

    // Domain
    AuthModule,
    SubmissionsModule,
    StudentsModule,
    RevisionsModule,
  ],
})
export class AppModule {}
