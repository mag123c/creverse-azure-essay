import type { INestApplication } from '@nestjs/common';
import { QueueModule } from '@src/infra/queue/queue.module';
import { type Submission, SubmissionStatus } from '@src/app/submissions/domain/submission';
import { SubmissionLogAction } from '@src/app/submissions/entities/submission-logs.entity';
import {
  DuplicateSubmissionException,
  SubmissionNotFoundException,
} from '@src/app/submissions/exception/submissions.exception';
import { SubmissionLogsRepository } from '@src/app/submissions/repositories/submission-logs.repository';
import { SubmissionsRepository } from '@src/app/submissions/repositories/submissions.repository';
import { SubmissionsService } from '@src/app/submissions/service/submissions.service';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { StudentFixture } from 'test/fixture/student.fixture';
import { SubmissionsFixture } from 'test/fixture/submissions.fixture';
import { VideoFileFixture } from 'test/fixture/video-file.fixture';
import { setupModule } from 'test/setup';
import { SubmissionProducer } from '@src/infra/queue/submissions/submission.producer';
import { OpenAIApiException } from '@src/infra/azure/openai/exception/openai.exception';
import { MediaFixture } from 'test/fixture/media.fixture';
import { SubmissionEvaluator } from '@src/app/submissions/service/submissions.evaluator';
import { SubmissionMediaUploader } from '@src/app/submissions/uploader/submission-media-uploader';
import { StudentsRepository } from '@src/app/students/repositories/students.repository';
import { StudentsModule } from '@src/app/students/students.module';
import { EvaluationFixture } from 'test/fixture/evaluation.fixture';
import { Media, type FileMetadata } from '@src/app/submissions/domain/media';

describe('[integration] Submissions', () => {
  let app: INestApplication;
  let submissionsService: SubmissionsService;
  let submissionProducer: SubmissionProducer;

  let submissionsRepository: SubmissionsRepository;
  let submissionLogsRepository: SubmissionLogsRepository;
  let studentRepository: StudentsRepository;

  const mockEvaluator = {
    evaluate: jest.fn(),
  };
  const mockUploader = {
    upload: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await setupModule(
      [SubmissionsModule, CustomDatabaseModule, StudentsModule, QueueModule],
      [],
      [],
      [
        { provide: SubmissionEvaluator, useValue: mockEvaluator },
        { provide: SubmissionMediaUploader, useValue: mockUploader },
      ],
    );
    app = moduleRef.createNestApplication();
    await app.init();

    submissionsService = moduleRef.get<SubmissionsService>(SubmissionsService);
    submissionProducer = moduleRef.get<SubmissionProducer>(SubmissionProducer);

    submissionsRepository = moduleRef.get<SubmissionsRepository>(SubmissionsRepository);
    submissionLogsRepository = moduleRef.get<SubmissionLogsRepository>(SubmissionLogsRepository);
    studentRepository = moduleRef.get<StudentsRepository>(StudentsRepository);
  });

  beforeEach(async () => {});

  afterEach(async () => {
    await submissionsRepository.delete({});
    await submissionLogsRepository.delete({});
    await studentRepository.delete({});
    jest.clearAllMocks();

    const queue = submissionProducer['submissionQueue'];

    if (queue) {
      try {
        await queue.drain(true);
        await Promise.all([queue.clean(0, 0, 'completed'), queue.clean(0, 0, 'failed'), queue.clean(0, 0, 'delayed')]);
        await queue.obliterate({ force: true }); // 워커에 작업이 남아있을 경우 백그라운드 에러(Unhandled Error)가 발생할 수 있음
      } catch {}
    }
  });

  afterAll(async () => {
    await VideoFileFixture.cleanupTmp();
    await app.close();
  });

  describe('평가 요청(generateSubmissionFeedback)', () => {
    it('평가 요청 시 큐에 Job이 등록된다.', async () => {
      const student = await studentRepository.save(StudentFixture.createMockStudent());

      await submissionsService.generateSubmissionFeedback(
        { id: student.id, name: student.name },
        { componentType: 'Essay Writing', submitText: 'Test queue' },
        await VideoFileFixture.prepareTmpMulterFile(),
      );

      // 큐에 Job이 등록되었는지 확인
      const suite = await submissionProducer['submissionQueue'].getJobs();
      expect(suite).toHaveLength(1);
      expect(suite[0].name).toBe('evaluate-and-upload');
      expect(suite[0].data).toMatchObject({
        submissionId: expect.any(Number),
        videoPath: expect.any(String),
      });
    });

    it('평가 요청 시 DB에 평가가 PENDING으로 등록된다.', async () => {
      const student = await studentRepository.save(StudentFixture.createMockStudent());

      await submissionsService.generateSubmissionFeedback(
        { id: student.id, name: student.name },
        { componentType: 'Essay Writing', submitText: 'Test queue' },
        await VideoFileFixture.prepareTmpMulterFile(),
      );

      // DB 엔티티 상태 체크
      const [suite] = await submissionsRepository.find({
        where: { student: { id: student.id } },
        relations: ['logs'],
      });
      expect(suite.status).toBe(SubmissionStatus.PENDING);
      expect(suite.logs).toHaveLength(1);
      expect(suite.logs![0].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(suite.logs![0].status).toBe(SubmissionStatus.PENDING);
    });

    it('중복 제출 시 예외를 반환한다.', async () => {
      const student = await studentRepository.save(StudentFixture.createMockStudent());
      const existsingSubmission = SubmissionsFixture.creatSubmissionEntity(student);
      await submissionsRepository.save(existsingSubmission);

      await expect(
        submissionsService.generateSubmissionFeedback(
          { id: student.id, name: student.name },
          { componentType: existsingSubmission.componentType, submitText: 'Test queue' },
        ),
      ).rejects.toBeInstanceOf(DuplicateSubmissionException);
    });
  });

  describe('평가 수행(runEvaluationJob)', () => {
    it('큐에 의해 평가가 수행될 때, 큐에 등록된 submissionId가 없으면 예외를 던진다.', async () => {
      await expect(
        submissionsService.runEvaluationJob(999, SubmissionLogAction.INITIALIZE_SUBMISSION),
      ).rejects.toBeInstanceOf(SubmissionNotFoundException);
    });

    it('큐에 의해 평가가 수행될 때, submission의 상태가 PENDING/FAILED가 아니면 아무 작업도 하지 않는다.', async () => {
      // 최초 평가 -> 성공 데이터를 입력
      const student = await studentRepository.save(StudentFixture.createMockStudentEntity());
      const mockSubmission = SubmissionsFixture.creatSubmissionEntity(student, { status: SubmissionStatus.SUCCESS });
      const mockSubmissionLog = SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission);
      await submissionsRepository.save(mockSubmission);
      await submissionLogsRepository.save(mockSubmissionLog);

      const markEvaluatingSpy = jest.spyOn(submissionsService as any, 'markEvaluating');
      const saveSubmissionResultSpy = jest.spyOn(submissionsService as any, 'saveSubmissionResult');
      const uploaderSpy = jest.spyOn(submissionsService['uploader'], 'upload' as any);
      const evaluatorSpy = jest.spyOn(submissionsService['evaluator'], 'evaluate' as any);

      await submissionsService.runEvaluationJob(mockSubmission.id, SubmissionLogAction.INITIALIZE_SUBMISSION);

      expect(markEvaluatingSpy).not.toHaveBeenCalled();
      expect(saveSubmissionResultSpy).not.toHaveBeenCalled();
      expect(uploaderSpy).not.toHaveBeenCalled();
      expect(evaluatorSpy).not.toHaveBeenCalled();
    });

    it('큐에 의해 평가가 수행될 때, submission에 수동 재시도 로그가 있으면 아무 작업도 하지 않는다.', async () => {
      // 최초 평가 실패 -> 수동 재시도 로그 입력
      const student = await studentRepository.save(StudentFixture.createMockStudentEntity());
      const mockSubmission = SubmissionsFixture.creatSubmissionEntity(student, { status: SubmissionStatus.FAILED });
      const mockSubmissionLogs = [
        // 실패 이력
        SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission, {
          action: SubmissionLogAction.REVISION_SUBMISSION,
          status: mockSubmission.status,
        }),

        // 재시도 이력
        SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission, {
          action: SubmissionLogAction.REVISION_SUBMISSION,
        }),
      ];

      await submissionsRepository.save(mockSubmission);
      await submissionLogsRepository.save(mockSubmissionLogs);

      const markEvaluatingSpy = jest.spyOn(submissionsService as any, 'markEvaluating');
      const saveSubmissionResultSpy = jest.spyOn(submissionsService as any, 'saveSubmissionResult');
      const uploaderSpy = jest.spyOn(submissionsService['uploader'], 'upload' as any);
      const evaluatorSpy = jest.spyOn(submissionsService['evaluator'], 'evaluate' as any);

      await submissionsService.runEvaluationJob(mockSubmission.id, SubmissionLogAction.INITIALIZE_SUBMISSION);

      expect(markEvaluatingSpy).not.toHaveBeenCalled();
      expect(saveSubmissionResultSpy).not.toHaveBeenCalled();
      expect(uploaderSpy).not.toHaveBeenCalled();
      expect(evaluatorSpy).not.toHaveBeenCalled();
    });

    it('큐에 의해 평가가 수행될 때, submission이 존재하면 평가를 수행한다.', async () => {
      // 평가 실패
      mockEvaluator.evaluate.mockImplementation(async () => {
        throw new OpenAIApiException('error', 'error');
      });
      mockUploader.upload.mockImplementation(async () => MediaFixture.createMedia());

      const student = await studentRepository.save(StudentFixture.createMockStudentEntity());
      const mockSubmission = SubmissionsFixture.creatSubmissionEntity(student);
      const mockSubmissionLog = SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission);
      await submissionsRepository.save(mockSubmission);
      await submissionLogsRepository.save(mockSubmissionLog);

      await expect(
        submissionsService.runEvaluationJob(mockSubmission.id, SubmissionLogAction.INITIALIZE_SUBMISSION),
      ).rejects.toBeInstanceOf(OpenAIApiException);
    });

    it('큐에 의해 평가가 수행될 때, 평가가 성공하고 업로더(upload)가 실패하면 업로드 실패 로그가 생성된다.', async () => {
      // 평가 실패
      mockEvaluator.evaluate.mockImplementation(async (submission: Submission) => {
        submission.applyEvaluation(EvaluationFixture.createEvaluation());
      });
      mockUploader.upload.mockImplementation(async (submission: Submission) => {
        submission.setMedia(Media.of('', '', {} as FileMetadata, 0)); // 빈 미디어 삽입
        throw new Error('upload error');
      });

      const student = await studentRepository.save(StudentFixture.createMockStudentEntity());
      const mockSubmission = SubmissionsFixture.creatSubmissionEntity(student);
      const mockSubmissionLog = SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission);
      await submissionsRepository.save(mockSubmission);
      await submissionLogsRepository.save(mockSubmissionLog);

      try {
        await submissionsService.runEvaluationJob(mockSubmission.id, SubmissionLogAction.INITIALIZE_SUBMISSION);
      } catch {}

      const [submission] = await submissionsRepository.find({
        where: { id: mockSubmission.id },
        relations: ['logs'],
      });
      expect(submission.status).toBe(SubmissionStatus.SUCCESS);
      expect(submission.logs).toHaveLength(4);

      expect(submission.logs![0].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![1].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![2].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![3].action).toBe(SubmissionLogAction.MEDIA_UPLOAD);
      expect(submission.logs![3].status).toBe(SubmissionStatus.FAILED);
    });

    it('큐에 의해 평가가 수행될 때, 평가와 업로더(upload)가 모두 성공하면 status가 SUCCESS이고 mediaUrl이 저장된다.', async () => {
      mockEvaluator.evaluate.mockImplementation(async (submission: Submission) => {
        submission.applyEvaluation(EvaluationFixture.createEvaluation());
      });
      mockUploader.upload.mockImplementation(async (submission: Submission) => {
        submission.setMedia(Media.of('videoUrl', 'audioUrl', {} as FileMetadata, 1000));
      });

      const student = await studentRepository.save(StudentFixture.createMockStudentEntity());
      const mockSubmission = SubmissionsFixture.creatSubmissionEntity(student);
      const mockSubmissionLog = SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission);
      await submissionsRepository.save(mockSubmission);
      await submissionLogsRepository.save(mockSubmissionLog);

      await submissionsService.runEvaluationJob(mockSubmission.id, SubmissionLogAction.INITIALIZE_SUBMISSION);

      const [submission] = await submissionsRepository.find({
        where: { id: mockSubmission.id },
        relations: ['logs'],
      });

      expect(submission.status).toBe(SubmissionStatus.SUCCESS);
      expect(submission.mediaUrl).not.toBeNull();
      expect(submission.logs).toHaveLength(4);

      expect(submission.logs![0].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![1].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![2].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![3].action).toBe(SubmissionLogAction.MEDIA_UPLOAD);
      expect(submission.logs![3].status).toBe(SubmissionStatus.SUCCESS);
    });

    it('큐에 의해 평가가 수행될 때, evaluator가 실패하면 submission이 FAILED로 저장된다.', async () => {
      mockEvaluator.evaluate.mockImplementation(async () => {
        throw new OpenAIApiException('evaluation error', 'evaluation error');
      });
      mockUploader.upload.mockImplementation(async (submission: Submission) => {
        submission.setMedia(Media.of('videoUrl', 'audioUrl', {} as FileMetadata, 1000));
      });

      const student = await studentRepository.save(StudentFixture.createMockStudentEntity());
      const mockSubmission = SubmissionsFixture.creatSubmissionEntity(student);
      const mockSubmissionLog = SubmissionsFixture.createInitializeEvaluationLogEntity(mockSubmission);
      await submissionsRepository.save(mockSubmission);
      await submissionLogsRepository.save(mockSubmissionLog);

      try {
        await submissionsService.runEvaluationJob(mockSubmission.id, SubmissionLogAction.INITIALIZE_SUBMISSION);
      } catch {}

      const [submission] = await submissionsRepository.find({
        where: { id: mockSubmission.id },
        relations: ['logs'],
      });

      expect(submission.status).toBe(SubmissionStatus.FAILED);
      expect(submission.logs).toHaveLength(4);

      expect(submission.logs![0].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![1].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![2].action).toBe(SubmissionLogAction.INITIALIZE_SUBMISSION);
      expect(submission.logs![3].action).toBe(SubmissionLogAction.MEDIA_UPLOAD);
    });
  });
});
