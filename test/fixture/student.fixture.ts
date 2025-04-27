import type { Student } from '@src/app/students/domain/student';
import { StudentsEntity } from '@src/app/students/entities/students.entity';

export class StudentFixture {
  static createMockStudent(): Student {
    return {
      id: 1,
      name: '홍길동',
    };
  }

  static createMockStudentEntity(): StudentsEntity {
    const entity = new StudentsEntity();
    entity.name = '홍길동';
    return entity;
  }
}
