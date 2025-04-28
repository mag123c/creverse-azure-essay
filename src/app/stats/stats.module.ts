import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStatsEntity } from './entities/daily-stats.entity';
import { MonthlyStatsEntity } from './entities/monthly-stats.entity';
import { WeeklyStatsEntity } from './entities/weekly-stats.entity';
import { DailyStatsRepository } from './repositories/daily-stats.repository';
import { MonthlyStatsRepository } from './repositories/monthly-stats.repository';
import { WeeklyStatsRepository } from './repositories/weekly-statsrepository';
import { StatsService } from './stats.service';
import { Module } from '@nestjs/common';
import { SubmissionsModule } from '../submissions/submissions.module';
import { RevisionsModule } from '../revisions/revisions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyStatsEntity, WeeklyStatsEntity, MonthlyStatsEntity]),
    SubmissionsModule,
    RevisionsModule,
  ],
  providers: [DailyStatsRepository, WeeklyStatsRepository, MonthlyStatsRepository, StatsService],
  exports: [StatsService],
})
export class StatsModule {}
