import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { DefaultEntity } from '@src/common/abstract/default.entity';
import { SubmissionsEntity } from './submissions.entity';
import { FileMetadata } from '../domain/media';

@Index('idx_submission_media_submission_id', ['submission'])
@Entity('submission_media')
export class SubmissionMediaEntity extends DefaultEntity {
  @ManyToOne(() => SubmissionsEntity, { nullable: false, onDelete: 'CASCADE' })
  submission!: SubmissionsEntity;

  @Column({ length: 255 })
  videoUrl!: string;

  @Column({ length: 255 })
  audioUrl!: string;

  @Column({ type: 'jsonb' })
  meta!: FileMetadata;
}
