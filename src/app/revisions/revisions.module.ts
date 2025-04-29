import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionsService } from './service/revisions.service';
import { RevisionsRepository } from './repositories/revisions.repository';
import { RevisionsController } from './revisions.contorller';
import { SubmissionsModule } from '../submissions/submissions.module';
import { RevisionsEntity } from './entities/revisions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RevisionsEntity]), SubmissionsModule],
  providers: [RevisionsService, RevisionsRepository],
  exports: [RevisionsService],
  controllers: [RevisionsController],
})
export class RevisionsModule {}
