import { Entity } from 'typeorm';
import { DefaultEntity } from '@src/common/abstract/default.entity';

@Entity('submission_media', { database: 'creverse' })
export class SubmissionMediaEntity extends DefaultEntity {}
