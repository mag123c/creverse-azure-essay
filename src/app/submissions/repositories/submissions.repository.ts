import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SubmissionsEntity } from '../entities/submissions.entity';
import { SubmissionLogAction } from '../entities/submission-logs.entity';
import { SubmissionStatus } from '../domain/submission';
import { getOffsetPaginatedResult } from '@src/common/pagination/offset-pagination.util';
import { OffsetPaginateResult } from '@src/common/pagination/pagination.interface';

@Injectable()
export class SubmissionsRepository extends Repository<SubmissionsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(SubmissionsEntity, dataSource.createEntityManager());
  }

  async findOneBySubmissionId(id: number): Promise<SubmissionsEntity | null> {
    return await this.findOne({ where: { id } });
  }

  /**
   * 학생의 제출을 컴포넌트 타입으로 조회
   */
  async findOneByStudentIdAndComponentType(
    studentId: number,
    componentType: string,
  ): Promise<SubmissionsEntity | null> {
    return this.findOne({ where: { student: { id: studentId }, componentType } });
  }

  /**
   * submissionId의 상태가 FAILED이면서, 수동 재시도(REVISION_SUBMISSION)인 제출을 조회
   */
  async findOneWithRevisionLog(submissionId: number): Promise<SubmissionsEntity | null> {
    return this.createQueryBuilder('submission')
      .innerJoinAndSelect('submission.student', 'student')
      .leftJoinAndSelect('submission.logs', 'log', 'log.action = :action', {
        action: SubmissionLogAction.REVISION_SUBMISSION,
      })
      .where('submission.id = :submissionId', { submissionId })
      .getOne();
  }

  /**
   * 학생의 전체 제출 조회 with pagination
   *  - 검색 필터, 소팅 적용
   */
  async findStudentSubmissionsWithPagination(
    studentId: number,
    req: {
      page: number;
      size: number;
      sort?: string;
      status?: SubmissionStatus;
      componentType?: string;
    },
  ): Promise<OffsetPaginateResult<SubmissionsEntity>> {
    const baseQuery = this.createQueryBuilder('submission')
      .innerJoinAndSelect('submission.student', 'student')
      .leftJoinAndSelect('submission.media', 'media')
      .where('student.id = :studentId', { studentId });

    // 필터
    if (req.status) {
      baseQuery.andWhere('submission.status = :status', { status: req.status });
    }
    // 검색
    if (req.componentType) {
      baseQuery.andWhere('submission.componentType = :componentType', { componentType: req.componentType });
    }

    // 정렬
    if (req.sort) {
      const [field, direction] = req.sort.split(',');
      baseQuery.orderBy(`submission.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
    } else {
      baseQuery.orderBy('submission.createdDt', 'DESC');
    }

    return getOffsetPaginatedResult(baseQuery, req.page, req.size);
  }
}
