import { Module } from '@nestjs/common';
import { StudentsEntity } from './entities/students.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([StudentsEntity])],
  providers: [],
  exports: [],
})
export class StudentsModule {}
