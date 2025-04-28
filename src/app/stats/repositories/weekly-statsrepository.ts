import { DataSource, Repository } from 'typeorm';
import { WeeklyStatsEntity } from '../entities/weekly-stats.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WeeklyStatsRepository extends Repository<WeeklyStatsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(WeeklyStatsEntity, dataSource.createEntityManager());
  }
}
