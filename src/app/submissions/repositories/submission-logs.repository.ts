import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SubmissionLogsEntity } from '../entities/submission-logs.entity';

@Injectable()
export class SubmissionLogsRepository extends Repository<SubmissionLogsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(SubmissionLogsEntity, dataSource.createEntityManager());
  }
}
