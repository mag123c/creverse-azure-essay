import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { SubmissionStatus } from '../domain/submission';
import { DefaultEntity } from '@src/common/abstract/default.entity';
import { SubmissionLogsEntity } from './submission-logs.entity';
import { Media } from '../domain/media';
import { StudentsEntity } from '@src/app/students/entities/students.entity';
import { SubmissionMediaEntity } from './submission-media.entity';

@Index('idx_submissions_student_status_created', ['student', 'status', 'createdDt'])
@Index('uq_submissions_student_component', ['student', 'componentType'], { unique: true })
@Index('idx_submissions_status_created', ['status', 'createdDt'])
@Index('idx_submissions_created', ['createdDt'])
@Entity('submissions')
export class SubmissionsEntity extends DefaultEntity {
  @Index('idx_submissions_student_id')
  @ManyToOne(() => StudentsEntity, (s) => s.submissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student!: StudentsEntity;

  @OneToMany(() => SubmissionLogsEntity, (log) => log.submission, {
    nullable: true,
  })
  logs?: SubmissionLogsEntity[];

  @OneToOne(() => SubmissionMediaEntity, (media) => media.submission, {
    nullable: true,
  })
  media?: SubmissionMediaEntity;

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

  @Column({ type: 'jsonb', nullable: true })
  mediaUrl?: Media;

  @Column({ type: 'varchar', length: 20 })
  status!: SubmissionStatus;
}
