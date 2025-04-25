import { Module } from '@nestjs/common';
import { StudentsEntity } from './entities/students.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './service/students.service';
import { StudentsRepository } from './repositories/students.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StudentsEntity])],
  providers: [StudentsService, StudentsRepository],
  exports: [StudentsService],
})
export class StudentsModule {}
