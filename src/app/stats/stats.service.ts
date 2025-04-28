import { Injectable } from '@nestjs/common';
import { SubmissionsService } from '../submissions/service/submissions.service';
import { DailyStatsRepository } from './repositories/daily-stats.repository';
import { WeeklyStatsRepository } from './repositories/weekly-statsrepository';
import { MonthlyStatsRepository } from './repositories/monthly-stats.repository';
import { RevisionsService } from '../revisions/service/revisions.service';
import { getPeriodRange } from './util/stats-util';
import { EvaluationStats } from './interface/stats.interface';

@Injectable()
export class StatsService {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly revisionsService: RevisionsService,

    private readonly dailyStatsRepository: DailyStatsRepository,
    private readonly weeklyStatsRepository: WeeklyStatsRepository,
    private readonly monthlyStatsRepository: MonthlyStatsRepository,
  ) {}

  /**
   * 일단위 (매일 자정) 통계 수집
   */
  async aggregateDaily() {
    const { startDate, endDate } = getPeriodRange('daily');
    const submissionsStatus: EvaluationStats = await this.submissionsService.computeEvaluationStatusByDate(
      startDate,
      endDate,
    );
    const revisionsStatus: EvaluationStats = await this.revisionsService.computeEvaluationStatusByDate(
      startDate,
      endDate,
    );

    await this.dailyStatsRepository.save({
      periodStart: startDate,
      totalSubmissions: submissionsStatus.totalCount,
      totalRevisions: revisionsStatus.totalCount,
      successCount: submissionsStatus.successCount,
      failedCount: submissionsStatus.failedCount,
      revisionSuccessCount: revisionsStatus.successCount,
      revisionFailedCount: revisionsStatus.failedCount,
    });
  }
  /**
   * 주단위 (매주 월요일 자정) 통계 수집
   */
  async aggregateWeekly() {
    const { startDate, endDate } = getPeriodRange('weekly');
    const submissionsStatus: EvaluationStats = await this.submissionsService.computeEvaluationStatusByDate(
      startDate,
      endDate,
    );
    const revisionsStatus: EvaluationStats = await this.revisionsService.computeEvaluationStatusByDate(
      startDate,
      endDate,
    );

    await this.weeklyStatsRepository.save({
      periodStart: startDate,
      totalSubmissions: submissionsStatus.totalCount,
      totalRevisions: revisionsStatus.totalCount,
      successCount: submissionsStatus.successCount,
      failedCount: submissionsStatus.failedCount,
      revisionSuccessCount: revisionsStatus.successCount,
      revisionFailedCount: revisionsStatus.failedCount,
    });
  }
  /**
   * 월단위 (매월 1일 자정) 통계 수집
   */
  async aggregateMonthly() {
    const { startDate, endDate } = getPeriodRange('monthly');
    const submissionsStatus: EvaluationStats = await this.submissionsService.computeEvaluationStatusByDate(
      startDate,
      endDate,
    );
    const revisionsStatus: EvaluationStats = await this.revisionsService.computeEvaluationStatusByDate(
      startDate,
      endDate,
    );

    await this.monthlyStatsRepository.save({
      periodStart: startDate,
      totalSubmissions: submissionsStatus.totalCount,
      totalRevisions: revisionsStatus.totalCount,
      successCount: submissionsStatus.successCount,
      failedCount: submissionsStatus.failedCount,
      revisionSuccessCount: revisionsStatus.successCount,
      revisionFailedCount: revisionsStatus.failedCount,
    });
  }
}
