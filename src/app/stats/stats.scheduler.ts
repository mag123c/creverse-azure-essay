import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StatsService } from './stats.service';

@Injectable()
export class StatsScheduler {
  private readonly logger = new Logger(StatsScheduler.name);
  constructor(private readonly statsService: StatsService) {}

  /**
   * 일단위 (매일 00:01) 통계 수집
   */
  @Cron('1 0 * * *')
  async handleDailyStats() {
    this.logger.log('일단위 통계 수집 시작');
    await this.statsService.aggregateDaily();
    this.logger.log('일단위 통계 수집 완료');
  }

  /**
   * 주단위 (매주 월요일 00:03) 통계 수집
   */
  @Cron('3 0 * * 1')
  async handleWeeklyStats() {
    this.logger.log('주단위 통계 수집 시작');
    await this.statsService.aggregateWeekly();
    this.logger.log('주단위 통계 수집 완료');
  }

  /**
   * 월단위 (매월 1일 00:05) 통계 수집
   */
  @Cron('5 0 1 * *')
  async handleMonthlyStats() {
    this.logger.log('월단위 통계 수집 시작');
    await this.statsService.aggregateMonthly();
    this.logger.log('월단위 통계 수집 완료');
  }
}
