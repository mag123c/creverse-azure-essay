import { DataSource, Repository } from 'typeorm';
import { DailyStatsEntity } from '../entities/daily-stats.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DailyStatsRepository extends Repository<DailyStatsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(DailyStatsEntity, dataSource.createEntityManager());
  }
}
