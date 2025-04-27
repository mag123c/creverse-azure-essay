import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SubmissionStatus } from '../domain/submission';
import { DefaultEntity } from '@src/common/abstract/default.entity';
import { SubmissionsEntity } from './submissions.entity';

export enum SubmissionLogAction {
  INITIALIZE_SUBMISSION = 'INITIAL_SUBMISSION', // 최초 제출
  RETRY_SUBMISSION = 'RETRY_SUBMISSION', // 재제출(배치)
  REVISION_SUBMISSION = 'REVISION_SUBMISSION', // 수정 제출(유저에 의해 수동)
  MEDIA_UPLOAD = 'MEDIA_UPLOAD', // 미디어 업로드 시
}

@Entity('submission_logs')
export class SubmissionLogsEntity extends DefaultEntity {
  @Index('idx_submission_logs_submission_id')
  @ManyToOne(() => SubmissionsEntity, (sub) => sub.logs, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission!: SubmissionsEntity;

  @Column({ type: 'varchar', length: 50 })
  action!: SubmissionLogAction;

  @Column({ type: 'varchar', length: 20 })
  status!: SubmissionStatus;

  @Column({ type: 'int', nullable: true })
  latency?: number;
}
