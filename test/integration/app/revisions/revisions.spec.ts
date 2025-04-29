import type { INestApplication } from '@nestjs/common';
import { RevisionsService } from '@src/app/revisions/service/revisions.service';
import { RevisionsRepository } from '@src/app/revisions/repositories/revisions.repository';
import { SubmissionsRepository } from '@src/app/submissions/repositories/submissions.repository';
import { StudentsRepository } from '@src/app/students/repositories/students.repository';
import { StudentFixture } from 'test/fixture/student.fixture';
import { SubmissionsFixture } from 'test/fixture/submissions.fixture';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { StudentsModule } from '@src/app/students/students.module';
import { setupModule } from 'test/setup';
import { type Submission, SubmissionStatus } from '@src/app/submissions/domain/submission';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import { SubmissionEvaluator } from '@src/app/submissions/service/submissions.evaluator';
import { SubmissionMediaUploader } from '@src/app/submissions/uploader/submission-media-uploader';
import { EvaluationFixture } from 'test/fixture/evaluation.fixture';
import { Media, type FileMetadata } from '@src/app/submissions/domain/media';
import { RevisionsModule } from '@src/app/revisions/revisions.module';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';
import { AlreadyEvaluatingException } from '@src/app/revisions/exception/revisions.exception';
import { SubmissionLogsRepository } from '@src/app/submissions/repositories/submission-logs.repository';

describe('[integration] Revisions', () => {
  let app: INestApplication;
  let revisionsService: RevisionsService;

  let revisionsRepository: RevisionsRepository;
  let submissionsRepository: SubmissionsRepository;
  let submissionLogsRepository: SubmissionLogsRepository;
  let studentsRepository: StudentsRepository;

  const mockEvaluator = {
    evaluate: jest.fn(),
  };
  const mockUploader = {
    upload: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await setupModule(
      [CustomDatabaseModule, RevisionsModule, SubmissionsModule, StudentsModule],
      [],
      [],
      [
        { provide: SubmissionEvaluator, useValue: mockEvaluator },
        { provide: SubmissionMediaUploader, useValue: mockUploader },
      ],
    );
    app = moduleRef.createNestApplication();
    await app.init();

    revisionsService = moduleRef.get<RevisionsService>(RevisionsService);
    revisionsRepository = moduleRef.get<RevisionsRepository>(RevisionsRepository);
    submissionsRepository = moduleRef.get<SubmissionsRepository>(SubmissionsRepository);
    submissionLogsRepository = moduleRef.get<SubmissionLogsRepository>(SubmissionLogsRepository);
    studentsRepository = moduleRef.get<StudentsRepository>(StudentsRepository);
  });

  afterEach(async () => {
    await revisionsRepository.delete({});
    await submissionsRepository.delete({});
    await submissionLogsRepository.delete({});
    await studentsRepository.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('재평가 요청(revisionSubmission)', () => {
    it('submission 상태가 변경되고, log가 남는다', async () => {
      const student = await studentsRepository.save(StudentFixture.createMockStudent());
      const submission = await submissionsRepository.save(SubmissionsFixture.creatSubmissionEntity(student));

      await revisionsService.revisionSubmission(student, submission.id);

      const updatedSubmission = await submissionsRepository.findOneOrFail({
        where: { id: submission.id },
        relations: ['logs'],
      });

      expect(updatedSubmission.status).toBe(SubmissionStatus.EVALUATING);

      expect(updatedSubmission.logs).toHaveLength(3);
      expect(updatedSubmission.logs![0].action).toBe(SubmissionLogAction.REVISION_SUBMISSION);
      expect(updatedSubmission.logs![0].status).toBe(SubmissionStatus.EVALUATING);
    });

    it('이미 평가 중(EVALUATING) 상태이면 재평가 요청 시 AlreadyEvaluatedException이 발생한다', async () => {
      const student = await studentsRepository.save(StudentFixture.createMockStudent());
      const submission = await submissionsRepository.save(
        SubmissionsFixture.creatSubmissionEntity(student, { status: SubmissionStatus.EVALUATING }),
      );

      await expect(revisionsService.revisionSubmission(student, submission.id)).rejects.toBeInstanceOf(
        AlreadyEvaluatingException,
      );
    });
  });

  describe('재평가 작업(revision)', () => {
    it('재평가 작업이 완료되면 revisions 테이블에 이력이 저장된다', async () => {
      const student = await studentsRepository.save(StudentFixture.createMockStudent());
      const submission = await submissionsRepository.save(
        SubmissionsFixture.creatSubmissionEntity(student, { status: SubmissionStatus.FAILED }),
      );

      const mockEvaluation = EvaluationFixture.createEvaluation();
      mockEvaluator.evaluate.mockImplementation(async (sb: Submission) => {
        sb.applyEvaluation(mockEvaluation);
      });
      mockUploader.upload.mockImplementation(async (sb: Submission) => {
        sb.setMedia(
          Media.of({
            videoUrl: 'videoUrl',
            audioUrl: 'audioUrl',
            meta: {} as FileMetadata,
            latency: 1000,
          }),
        );
      });

      await revisionsService.revisionSubmission(student, submission.id);

      const submissionResult = await submissionsRepository.findOneOrFail({
        where: { id: submission.id },
        relations: ['media', 'revisions'],
      });

      expect(submissionResult.revisions).toHaveLength(1);

      const revision = submissionResult.revisions![0];
      expect(revision.status).toBe(submissionResult.status);
      expect(revision.componentType).toBe(submission.componentType);
      expect(revision.submitText).toBe(submission.submitText);
      expect(revision.feedback).toBe(mockEvaluation.getFeedback());
      expect(revision.score).toBe(mockEvaluation.getScore());
      expect(revision.highlights).toEqual(mockEvaluation.getHighlights());
    });
  });
});
