import type { StudentsEntity } from '@src/app/students/entities/students.entity';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { SubmissionLogAction, SubmissionLogsEntity } from '@src/app/submissions/entities/submission-logs.entity';
import { SubmissionsEntity } from '@src/app/submissions/entities/submissions.entity';

export class SubmissionsFixture {
  static creatSubmissionEntity(student: StudentsEntity, partial?: Partial<SubmissionsEntity>): SubmissionsEntity {
    const entity = new SubmissionsEntity();
    entity.student = student;
    entity.componentType = partial?.componentType ?? 'componentType';
    entity.submitText = partial?.submitText ?? 'submitText';
    entity.highlightSubmitText = partial?.highlightSubmitText;
    entity.feedback = partial?.feedback;
    entity.highlights = partial?.highlights;
    entity.status = partial?.status ?? SubmissionStatus.PENDING;
    return entity;
  }

  static createInitializeEvaluationLogEntity(
    submission: SubmissionsEntity,
    partial?: Partial<SubmissionLogsEntity>,
  ): SubmissionLogsEntity {
    const entity = new SubmissionLogsEntity();
    entity.submission = submission;
    entity.action = partial?.action ?? SubmissionLogAction.INITIALIZE_SUBMISSION;
    entity.status = partial?.status ?? submission.status;
    entity.latency = partial?.latency ?? 0;
    return entity;
  }
}
