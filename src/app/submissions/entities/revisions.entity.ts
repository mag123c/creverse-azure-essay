import { DefaultEntity } from '@src/common/abstract/default.entity';
import { ManyToOne, JoinColumn, Column, Index, Entity } from 'typeorm';
import { SubmissionStatus } from '../domain/submission';
import { SubmissionsEntity } from './submissions.entity';

@Entity('revisions')
export class RevisionsEntity extends DefaultEntity {
  @Index('idx_revisions_submission', ['submission'])
  @ManyToOne(() => SubmissionsEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission!: SubmissionsEntity;

  @Column({ type: 'varchar', length: 20 })
  previousStatus!: SubmissionStatus;

  @Column({ type: 'varchar', length: 20 })
  newStatus!: SubmissionStatus;
}
