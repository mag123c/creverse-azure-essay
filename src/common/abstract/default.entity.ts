import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class DefaultEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id!: number;

  @CreateDateColumn({ type: 'timestamptz', precision: 0 })
  readonly createdDt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 0 })
  readonly updatedDt!: Date;
}

export abstract class DefaultOmitUpdateDtEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id!: number;

  @CreateDateColumn({ type: 'timestamptz', precision: 0 })
  readonly createdDt!: Date;
}
