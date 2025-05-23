import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RevisionsEntity } from '../entities/revisions.entity';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { OffsetPaginateResult } from '@src/common/pagination/pagination.interface';
import { getOffsetPaginatedResult } from '@src/common/pagination/offset-pagination.util';
import { EvaluationStats } from '@src/app/stats/interface/stats.interface';

@Injectable()
export class RevisionsRepository extends Repository<RevisionsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(RevisionsEntity, dataSource.createEntityManager());
  }

  /**
   * 학생의 (수동) 재평가 리스트 조회
   */
  async findStudentRevisionsWithPagination(
    studentId: number,
    req: {
      page: number;
      size: number;
      sort?: string;
      status?: SubmissionStatus;
      componentType?: string;
    },
  ): Promise<OffsetPaginateResult<RevisionsEntity>> {
    const baseQuery = this.createQueryBuilder('revisions')
      .innerJoinAndSelect('revisions.submission', 'submission')
      .innerJoinAndSelect('submission.student', 'student')
      .select([
        'revisions.id',
        'revisions.componentType',
        'revisions.status',
        'revisions.createdDt',
        'revisions.score',
        'submission.id',
        'student.id',
        'student.name',
      ])
      .where('student.id = :studentId', { studentId })
      .orderBy('revisions.createdDt', 'DESC');

    // 필터
    if (req.status) {
      baseQuery.andWhere('revisions.status = :status', { status: req.status });
    }

    // 검색
    if (req.componentType) {
      baseQuery.andWhere('revisions.componentType = :componentType', { componentType: req.componentType });
    }

    // 정렬
    if (req.sort) {
      const [field, direction] = req.sort.split(',');
      baseQuery.orderBy(`revisions.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
    }

    return getOffsetPaginatedResult(baseQuery, req.page, req.size);
  }

  /**
   * 학생의 수동 재평가 내역 상세 조회
   */
  async findRevisionDetail(revisionId: number): Promise<RevisionsEntity | null> {
    return await this.createQueryBuilder('revisions')
      .innerJoinAndSelect('revisions.submission', 'submission')
      .innerJoinAndSelect('submission.student', 'student')
      .leftJoinAndSelect('submission.media', 'media')
      .where('revisions.id = :revisionId', { revisionId })
      .getOne();
  }

  /**
   * 통계용
   */
  async computeEvaluationStatusByDate(startDate: string, endDate: string): Promise<EvaluationStats | undefined> {
    return await this.createQueryBuilder('revisions')
      .select('COUNT(*)', 'totalCount')
      .addSelect(`SUM(CASE WHEN revisions.status = 'SUCCESS' THEN 1 ELSE 0 END)`, 'successCount')
      .addSelect(`SUM(CASE WHEN revisions.status = 'FAILED' THEN 1 ELSE 0 END)`, 'failedCount')
      .where('revisions.createdDt >= :startDate', { startDate: `${startDate} 00:00:00` })
      .andWhere('revisions.createdDt <= :endDate', { endDate: `${endDate} 23:59:59` })
      .getRawOne<EvaluationStats>();
  }
}
