import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SubmissionsEntity } from '../entities/submissions.entity';
import { SubmissionLogAction } from '../entities/submission-logs.entity';

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
}
