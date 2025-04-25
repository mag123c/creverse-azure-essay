import { Module } from '@nestjs/common';
import { SubmissionsService } from './service/submissions.service';
import { OpenAIModule } from '@src/infra/azure/openai/openai.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionEvaluator } from './service/submissions.evaluator';

@Module({
  imports: [OpenAIModule],
  providers: [SubmissionsService, SubmissionEvaluator],
  exports: [],
  controllers: [SubmissionsController],
})
export class SubmissionsModule {}
