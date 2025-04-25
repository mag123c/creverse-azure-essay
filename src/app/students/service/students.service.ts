import { Injectable } from '@nestjs/common';
import { StudentsRepository } from '../repositories/students.repository';
import { StudentsEntity } from '../entities/students.entity';

@Injectable()
export class StudentsService {
  constructor(private readonly studentsRepository: StudentsRepository) {}

  async findById(id: number): Promise<StudentsEntity | null> {
    return await this.studentsRepository.findOne({ where: { id } });
  }

  async create(name: string): Promise<StudentsEntity> {
    return await this.studentsRepository.save({ name });
  }
}
