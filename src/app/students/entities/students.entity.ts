import { SubmissionsEntity } from '@src/app/submissions/entities/submissions.entity';
import { DefaultEntity } from '@src/common/abstract/default.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Index('idx_students_name', ['name'])
@Entity('students', { database: 'creverse' })
export class StudentsEntity extends DefaultEntity {
  @Column({ type: 'varchar', length: 10 })
  name!: string;

  @OneToMany(() => SubmissionsEntity, (sub) => sub.student, {
    nullable: true,
  })
  submissions?: SubmissionsEntity[];
}
