import type { Student } from '@src/app/students/domain/student';

export class StudentFixture {
  static createMockStudent(): Student {
    return {
      id: 1,
      name: '홍길동',
    };
  }
}
