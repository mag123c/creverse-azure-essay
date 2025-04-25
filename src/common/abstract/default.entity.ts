import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class DefaultEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  readonly createdDt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  readonly updatedDt!: Date;
}
