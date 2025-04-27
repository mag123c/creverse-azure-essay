import { faker } from '@faker-js/faker';
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
    entity.name = faker.string.alpha({ length: { min: 3, max: 10 } });
    return entity;
  }
}
