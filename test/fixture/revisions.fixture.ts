import { RevisionsEntity } from '@src/app/revisions/entities/revisions.entity';
import type { SubmissionsEntity } from '@src/app/submissions/entities/submissions.entity';
import { faker } from '@faker-js/faker';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';

export class RevisionsFixture {
  static createRevisionEntity(submission: SubmissionsEntity, partial?: Partial<RevisionsEntity>): RevisionsEntity {
    const entity = new RevisionsEntity();
    entity.submission = submission;
    entity.status = partial?.status ?? SubmissionStatus.PENDING;
    entity.componentType = partial?.componentType ?? `comp_${faker.string.alpha({ length: 10 })}`;
    entity.submitText = partial?.submitText ?? faker.lorem.paragraph();
    entity.highlightSubmitText = partial?.highlightSubmitText;
    entity.score = partial?.score ?? faker.number.int({ min: 0, max: 10 });
    entity.feedback = partial?.feedback ?? faker.lorem.sentence();
    entity.highlights = partial?.highlights ?? [faker.lorem.words(3)];

    return entity;
  }
}
