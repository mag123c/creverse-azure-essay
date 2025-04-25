import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SubmissionsEntity } from '../entities/submissions.entity';

@Injectable()
export class SubmissionsRepository extends Repository<SubmissionsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(SubmissionsEntity, dataSource.createEntityManager());
  }

  /**
   * 중복된 컴포넌트 타입 제출을 찾습니다.
   */
  async findDuplicateSubmission(studentId: number, componentType: string): Promise<SubmissionsEntity | null> {
    return await this.createQueryBuilder('submission')
      .where('submission.student = :studentId', { studentId })
      .andWhere('submission.componentType = :componentType', { componentType })
      .getOne();
  }
}
