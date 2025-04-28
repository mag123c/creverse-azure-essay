import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionsService } from './service/revisions.service';
import { RevisionsRepository } from './repositories/revisions.repository';
import { RevisionsController } from './revisions.contorller';
import { RevisionsQueueModule } from '@src/infra/queue/revisions/revision-queue.module';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), forwardRef(() => RevisionsQueueModule), SubmissionsModule],
  providers: [RevisionsService, RevisionsRepository],
  exports: [RevisionsService],
  controllers: [RevisionsController],
})
export class RevisionsModule {}
