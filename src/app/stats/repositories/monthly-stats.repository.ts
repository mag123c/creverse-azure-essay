import { DataSource, Repository } from 'typeorm';
import { MonthlyStatsEntity } from '../entities/monthly-stats.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MonthlyStatsRepository extends Repository<MonthlyStatsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(MonthlyStatsEntity, dataSource.createEntityManager());
  }
}
