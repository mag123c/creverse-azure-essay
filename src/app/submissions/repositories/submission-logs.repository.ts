import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SubmissionLogAction, SubmissionLogsEntity } from '../entities/submission-logs.entity';
import { EvaluationStats } from '@src/app/stats/interface/stats.interface';

@Injectable()
export class SubmissionLogsRepository extends Repository<SubmissionLogsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(SubmissionLogsEntity, dataSource.createEntityManager());
  }

  async computeSubmissionStatusByDateWithAction(
    startDate: string,
    endDate: string,
    action: SubmissionLogAction = SubmissionLogAction.INITIALIZE_SUBMISSION,
  ): Promise<EvaluationStats | undefined> {
    return await this.createQueryBuilder('logs')
      .select('COUNT(*)', 'totalCount')
      .addSelect("SUM(CASE WHEN logs.status = 'SUCCESS' THEN 1 ELSE 0 END)", 'successCount')
      .addSelect("SUM(CASE WHEN logs.status = 'FAILED' THEN 1 ELSE 0 END)", 'failedCount')
      .where('logs.action = :action', { action })
      .where('logs.createdDt >= :startDate', { startDate: `${startDate} 00:00:00` })
      .andWhere('logs.createdDt <= :endDate', { endDate: `${endDate} 23:59:59` })
      .getRawOne<EvaluationStats>();
  }
}
