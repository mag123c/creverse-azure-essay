import { Injectable } from '@nestjs/common';
import { StudentsRepository } from '../repositories/students.repository';
import { StudentsEntity } from '../entities/students.entity';

@Injectable()
export class StudentsService {
  constructor(private readonly studentsRepository: StudentsRepository) {}

  async findById(id: number): Promise<StudentsEntity | null> {
    return await this.studentsRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<StudentsEntity | null> {
    return await this.studentsRepository.findOne({ where: { name }, order: { id: 'DESC' } });
  }

  async create(name: string): Promise<StudentsEntity> {
    return await this.studentsRepository.save({ name });
  }
}
