import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { SubmissionsEntity } from '@src/app/submissions/entities/submissions.entity';
import { DefaultOmitUpdateDtEntity } from '@src/common/abstract/default.entity';
import { ManyToOne, JoinColumn, Column, Index, Entity } from 'typeorm';

@Index('idx_revisions_created', ['createdDt'])
@Entity('revisions')
export class RevisionsEntity extends DefaultOmitUpdateDtEntity {
  @Index('idx_revisions_submission', ['submission'])
  @ManyToOne(() => SubmissionsEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission!: SubmissionsEntity;

  @Column({ type: 'varchar', length: 20 })
  status!: SubmissionStatus;

  @Column({ length: 100 })
  componentType!: string;

  @Column({ type: 'text' })
  submitText!: string;

  @Column({ type: 'text', nullable: true })
  highlightSubmitText?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'jsonb', nullable: true })
  highlights?: string[];
}
