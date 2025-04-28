import type { INestApplication } from '@nestjs/common';
import { RevisionsService } from '@src/app/revisions/service/revisions.service';
import { RevisionProducer } from '@src/infra/queue/revisions/revision.producer';
import { RevisionsRepository } from '@src/app/revisions/repositories/revisions.repository';
import { SubmissionsRepository } from '@src/app/submissions/repositories/submissions.repository';
import { StudentsRepository } from '@src/app/students/repositories/students.repository';
import { StudentFixture } from 'test/fixture/student.fixture';
import { SubmissionsFixture } from 'test/fixture/submissions.fixture';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { StudentsModule } from '@src/app/students/students.module';
import { setupModule } from 'test/setup';
import { type Submission, SubmissionStatus } from '@src/app/submissions/domain/submission';
import { RevisionsQueueModule } from '@src/infra/queue/revisions/revision-queue.module';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import { SubmissionEvaluator } from '@src/app/submissions/service/submissions.evaluator';
import { SubmissionMediaUploader } from '@src/app/submissions/uploader/submission-media-uploader';
import { EvaluationFixture } from 'test/fixture/evaluation.fixture';
import { Media, type FileMetadata } from '@src/app/submissions/domain/media';
import { RevisionsModule } from '@src/app/revisions/revisions.module';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';
import { AlreadyEvaluatingException } from '@src/app/revisions/exception/revisions.exception';

describe('[integration] Revisions', () => {
  let app: INestApplication;
  let revisionsService: RevisionsService;

  let revisionsRepository: RevisionsRepository;
  let submissionsRepository: SubmissionsRepository;
  let studentsRepository: StudentsRepository;
  let revisionProducer: RevisionProducer;

  const mockEvaluator = {
    evaluate: jest.fn(),
  };
  const mockUploader = {
    upload: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await setupModule(
      [CustomDatabaseModule, RevisionsModule, SubmissionsModule, StudentsModule, RevisionsQueueModule],
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
    studentsRepository = moduleRef.get<StudentsRepository>(StudentsRepository);
    revisionProducer = moduleRef.get<RevisionProducer>(RevisionProducer);

    await queueObliterate(revisionProducer['revisionQueue']);
  });

  afterEach(async () => {
    await revisionsRepository.delete({});
    await submissionsRepository.delete({});
    await studentsRepository.delete({});
    await queueObliterate(revisionProducer['revisionQueue']);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('재평가 요청(revisionSubmission)', () => {
    it('재평가 요청 시 큐에 작업이 등록된다', async () => {
      const student = await studentsRepository.save(StudentFixture.createMockStudent());
      const submission = await submissionsRepository.save(SubmissionsFixture.creatSubmissionEntity(student));

      await revisionsService.revisionSubmission(student, submission.id);

      const jobs = await revisionProducer['revisionQueue'].getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].name).toBe('submission-revision');
      expect(jobs[0].data).toEqual(expect.objectContaining({ submissionId: submission.id }));
    });

    it('revision이 최초 등록된다', async () => {
      const student = await studentsRepository.save(StudentFixture.createMockStudent());
      const submission = await submissionsRepository.save(SubmissionsFixture.creatSubmissionEntity(student));

      await revisionsService.revisionSubmission(student, submission.id);

      const revisions = await revisionsRepository.find({
        where: { submission: { id: submission.id } },
        relations: ['submission'],
      });

      expect(revisions).toHaveLength(1);
      expect(revisions[0].status).toBe(SubmissionStatus.EVALUATING);
      expect(revisions[0].submission.id).toBe(submission.id);

      const jobs = await revisionProducer['revisionQueue'].getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].data).toEqual(expect.objectContaining({ submissionId: submission.id }));
    });

    it('submission 상태가 변경되고, log가 남는다', async () => {
      const student = await studentsRepository.save(StudentFixture.createMockStudent());
      const submission = await submissionsRepository.save(SubmissionsFixture.creatSubmissionEntity(student));

      await revisionsService.revisionSubmission(student, submission.id);

      const updatedSubmission = await submissionsRepository.findOneOrFail({
        where: { id: submission.id },
        relations: ['logs'],
      });

      expect(updatedSubmission.status).toBe(SubmissionStatus.EVALUATING);

      expect(updatedSubmission.logs).toHaveLength(1);
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

  describe('재평가 작업(runRevisionJob)', () => {
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
      await revisionsService.runRevisionJob(submission.id, SubmissionLogAction.REVISION_SUBMISSION);

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

const queueObliterate = async (queue: any) => {
  try {
    await queue.drain(true);
    await Promise.all([queue.clean(0, 0, 'completed'), queue.clean(0, 0, 'failed'), queue.clean(0, 0, 'delayed')]);
    await queue.obliterate({ force: true }); // 워커에 작업이 남아있을 경우 백그라운드 에러(Unhandled Error)가 발생할 수 있음
  } catch {}
};
