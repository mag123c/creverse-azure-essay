import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SubmissionMediaEntity } from '../entities/submission-media.entity';

@Injectable()
export class SubmissionMediaRepository extends Repository<SubmissionMediaEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(SubmissionMediaEntity, dataSource.createEntityManager());
  }
}
