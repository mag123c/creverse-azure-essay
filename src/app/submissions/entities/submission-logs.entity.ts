import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SubmissionStatus } from '../domain/submission';
import { DefaultEntity } from '@src/common/abstract/default.entity';
import { SubmissionsEntity } from './submissions.entity';

export type SubmissionLogAction = 'INITIAL' | 'RETRY' | 'REVISION';

@Entity('submission_logs', { database: 'creverse' })
export class SubmissionLogsEntity extends DefaultEntity {
  @Index('idx_submission_logs_submission_id')
  @ManyToOne(() => SubmissionsEntity, (sub) => sub.logs, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission!: SubmissionsEntity;

  @Column({ type: 'varchar', length: 50 })
  action!: SubmissionLogAction;

  @Column({ type: 'varchar', length: 20 })
  status!: SubmissionStatus;

  @Column({ type: 'int', default: 0 })
  apiLatency!: number;

  @Column({ length: 100, nullable: true })
  traceId?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  // 요청·응답 원본 덤프
  @Column({ type: 'jsonb', nullable: true })
  payload?: any;
}
