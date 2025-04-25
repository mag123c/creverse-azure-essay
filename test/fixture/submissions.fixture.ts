import type { StudentsEntity } from '@src/app/students/entities/students.entity';
import type { SubmissionsEntity } from '@src/app/submissions/entities/submissions.entity';
import { generateTraceId } from '@src/common/utils/crpyto';

export class SubmissionsFixture {
  static createPendingSubmissionEntity(
    student: StudentsEntity,
    partial?: Partial<SubmissionsEntity>,
  ): SubmissionsEntity {
    return {
      student,
      componentType: partial?.componentType ?? 'componentType',
      submitText: partial?.submitText ?? 'submitText',
      highlightSubmitText: '',
      feedback: '',
      highlights: [],
      traceId: generateTraceId(),
      status: 'PENDING',
      ...partial,
    } as SubmissionsEntity;
  }
}
