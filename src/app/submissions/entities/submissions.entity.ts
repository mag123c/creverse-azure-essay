import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SubmissionStatus } from '../domain/submission';
import { DefaultEntity } from '@src/common/abstract/default.entity';
import { SubmissionLogsEntity } from './submission-logs.entity';
import { Media } from '../domain/media';
import { StudentsEntity } from '@src/app/students/entities/students.entity';

@Index('uq_submissions_student_component', ['student', 'componentType'], { unique: true })
@Index('idx_submissions_status_created', ['status', 'createdDt'])
@Index('idx_submissions_created', ['createdDt'])
@Entity('submissions')
export class SubmissionsEntity extends DefaultEntity {
  @Index('idx_submissions_student_id')
  @ManyToOne(() => StudentsEntity, (s) => s.submissions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: StudentsEntity;

  @OneToMany(() => SubmissionLogsEntity, (log) => log.submission, {
    nullable: true,
  })
  logs?: SubmissionLogsEntity[];

  @Column({ length: 50 })
  componentType!: string;

  @Column({ type: 'text' })
  submitText!: string;

  @Column({ type: 'text' })
  highlightSubmitText!: string;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ type: 'text' })
  feedback!: string;

  @Column({ type: 'jsonb' })
  highlights!: string[];

  @Column({ type: 'jsonb', nullable: true })
  mediaUrl?: Media;

  @Column({ type: 'varchar', length: 20 })
  status!: SubmissionStatus;

  @Column({ type: 'int', default: 0 })
  apiLatency!: number;

  @Column({ length: 100, nullable: true })
  traceId?: string;
}
