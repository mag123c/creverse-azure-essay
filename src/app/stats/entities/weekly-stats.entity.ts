import { DefaultOmitUpdateDtEntity } from '@src/common/abstract/default.entity';
import { Entity, Column, Index, PrimaryColumn } from 'typeorm';

@Entity('stats_weekly')
@Index(['periodStart'], { unique: true })
export class WeeklyStatsEntity extends DefaultOmitUpdateDtEntity {
  @PrimaryColumn({ type: 'date' })
  periodStart!: string;

  @Column({ type: 'int', comment: '총 과제 요청 수' })
  totalSubmissions!: number;

  @Column({ type: 'int', comment: '총 재평가 요청 수' })
  totalRevisions!: number;

  @Column({ type: 'int', comment: '성공으로 완료된 재평가 수' })
  successCount!: number;

  @Column({ type: 'int', comment: '실패로 끝난 재평가 수' })
  failedCount!: number;

  @Column({ type: 'int', comment: '성공으로 완료된 재평가 수' })
  revisionSuccessCount!: number;

  @Column({ type: 'int', comment: '성공으로 완료된 재평가 수' })
  revisionFailedCount!: number;
}
