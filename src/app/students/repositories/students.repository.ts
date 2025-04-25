import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StudentsEntity } from '../entities/students.entity';

@Injectable()
export class StudentsRepository extends Repository<StudentsEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StudentsEntity, dataSource.createEntityManager());
  }
}
