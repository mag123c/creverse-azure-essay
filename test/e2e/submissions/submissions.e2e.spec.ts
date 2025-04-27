import type { INestApplication } from '@nestjs/common';
import { StudentsRepository } from '@src/app/students/repositories/students.repository';
import { StudentsModule } from '@src/app/students/students.module';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { SubmissionLogsRepository } from '@src/app/submissions/repositories/submission-logs.repository';
import { SubmissionsRepository } from '@src/app/submissions/repositories/submissions.repository';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';
import { BlobStorageService } from '@src/infra/azure/blob/service/blob-storage.service';
import { OpenAIService } from '@src/infra/azure/openai/service/openai.service';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { QueueModule } from '@src/infra/queue/queue.module';
import { setupApp, setupJWT, setupModule, setupStudent } from 'test/setup';
import request from 'supertest';
import { AuthModule } from '@src/app/auth/auth.module';
import type { StudentsEntity } from '@src/app/students/entities/students.entity';
import { faker } from '@faker-js/faker';
import { SubmissionsFixture } from 'test/fixture/submissions.fixture';
import { Media } from '@src/app/submissions/domain/media';
import { MediaFixture } from 'test/fixture/media.fixture';
import { SubmissionMediaRepository } from '@src/app/submissions/repositories/submission-media.repository';

type QueryOption = {
  desc: string;
  query: {
    status?: string;
    componentType?: string;
    sort?: string;
    page?: number;
    size?: number;
  };
};

describe('[e2e] Submissions', () => {
  let app: INestApplication;
  const mockOpenAIService = {
    evaluate: jest.fn(),
  };
  const mockBlobStorageService = {
    uploadFileFromPath: jest.fn(),
  };

  let submissionsRepository: SubmissionsRepository;
  let submissionLogsRepository: SubmissionLogsRepository;
  let submissionMediasRepository: SubmissionMediaRepository;
  let studentRepository: StudentsRepository;

  beforeAll(async () => {
    const moduleRef = await setupModule(
      [SubmissionsModule, CustomDatabaseModule, AuthModule, QueueModule, StudentsModule],
      [],
      [],
      [
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: BlobStorageService,
          useValue: mockBlobStorageService,
        },
      ],
    );

    app = moduleRef.createNestApplication();
    await setupApp(app);

    submissionsRepository = moduleRef.get<SubmissionsRepository>(SubmissionsRepository);
    submissionLogsRepository = moduleRef.get<SubmissionLogsRepository>(SubmissionLogsRepository);
    submissionMediasRepository = moduleRef.get<SubmissionMediaRepository>(SubmissionMediaRepository);
    studentRepository = moduleRef.get<StudentsRepository>(StudentsRepository);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await submissionsRepository.delete({});
    await submissionLogsRepository.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/submissions (pagination & filter)', () => {
    let student: StudentsEntity;
    let accessToken: string;

    beforeAll(async () => {
      student = await setupStudent(app);
      accessToken = await setupJWT(app, student);
    });

    afterAll(async () => {
      await studentRepository.delete({});
    });

    it.each<QueryOption>([
      { desc: '기본 조회', query: {} },
      { desc: `상태 필터: ${SubmissionStatus.EVALUATING}`, query: { status: `${SubmissionStatus.EVALUATING}` } },
      { desc: `상태 필터: ${SubmissionStatus.PENDING}`, query: { status: `${SubmissionStatus.PENDING}` } },
      { desc: `상태 필터: ${SubmissionStatus.SUCCESS}`, query: { status: `${SubmissionStatus.SUCCESS}` } },
      { desc: `상태 필터: ${SubmissionStatus.FAILED}`, query: { status: `${SubmissionStatus.FAILED}` } },
      {
        desc: '컴포넌트 타입 필터',
        query: { componentType: 'Essay Writing' },
      },
      { desc: '정렬 기준 변경 (createdDt ASC)', query: { sort: 'createdDt,ASC' } },
    ])('$desc', async ({ query }) => {
      // 데이터 세팅
      const mockSubmissions = [];
      const totalSubmissions = faker.number.int({ min: 70, max: 100 });

      const evaluationStatusPerCount = new Map<SubmissionStatus, number>(
        Object.values(SubmissionStatus).map((status) => [status, 0]),
      );

      for (let i = 0; i < totalSubmissions; i++) {
        const status = faker.helpers.arrayElement([...evaluationStatusPerCount.keys()]);
        const submission = SubmissionsFixture.creatSubmissionEntity(
          student,
          {
            status,
            highlightSubmitText: faker.lorem.sentence(),
            feedback: faker.lorem.sentence(),
            highlights: [faker.lorem.words(3), faker.lorem.words(3)],
            mediaUrl: faker.helpers.arrayElement([
              undefined,
              Media.of(
                faker.internet.url(),
                faker.internet.url(),
                {
                  format: faker.system.fileExt(),
                  duration: faker.number.int({ min: 60, max: 3600 }),
                  resolution: `${faker.number.int({ min: 720, max: 2160 })}p`,
                  originalFileName: faker.system.fileName(),
                },
                faker.number.int({ min: 100, max: 1000 }),
              ),
            ]),
          },
          i,
        );
        mockSubmissions.push(submission);
        evaluationStatusPerCount.set(status, (evaluationStatusPerCount.get(status) ?? 0) + 1);
      }

      if (query.componentType) {
        mockSubmissions[Math.floor(mockSubmissions.length / 2)].componentType = 'Essay Writing';
      }

      await submissionsRepository.save(mockSubmissions);

      // when
      const response = await request(app.getHttpServer())
        .get('/v1/submissions')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      // then
      expect(response.status).toBe(200);
      expect(response.body.result).toBe('ok');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();

      const { meta, data } = response.body;

      if (query.status) {
        for (const item of data) {
          expect(item.status).toBe(query.status);
        }
      }

      if (query.componentType) {
        expect(data.length).toBe(1);
        for (const item of data) {
          expect(item.componentType).toBe('Essay Writing');
        }
      }

      if (query.sort === 'createdDt,ASC') {
        for (let i = 1; i < data.length; i++) {
          const prev = new Date(data[i - 1].createdDt);
          const curr = new Date(data[i].createdDt);
          expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
        }
      }

      // meta 필수 항목 검증
      expect(typeof meta.total).toBe('number');
      expect(typeof meta.currentPage).toBe('number');
      expect(typeof meta.perPage).toBe('number');
      expect(typeof meta.hasNext).toBe('boolean');

      // meta 동적 값 검증
      expect(meta.currentPage).toBe(Number(query?.page) || 1);
      expect(meta.perPage).toBe(Number(query?.size) || 20);

      //필터 조건에 따라 기대 total 계산
      let expectedTotal = mockSubmissions.length;
      if (query.status) {
        expectedTotal = mockSubmissions.filter((s) => s.status === query.status).length;
      }
      if (query.componentType) {
        expectedTotal = mockSubmissions.filter((s) => s.componentType === query.componentType).length;
      }
      expect(meta.total).toBe(expectedTotal);

      // hasNext 검증
      const expectedHasNext = meta.total > meta.currentPage * meta.perPage;
      expect(meta.hasNext).toBe(expectedHasNext);
    });

    it('조회 결과가 없으면 빈 배열을 가져온다.', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/submissions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /v1/submissions/:submissionId (detail)', () => {
    let student: StudentsEntity;
    let accessToken: string;

    beforeAll(async () => {
      student = await setupStudent(app);
      accessToken = await setupJWT(app, student);
    });

    afterAll(async () => {
      await studentRepository.delete({});
    });

    it('상세 조회 - 정상 조회', async () => {
      // 데이터 세팅
      const submission = await submissionsRepository.save(
        SubmissionsFixture.creatSubmissionEntity(student, {
          highlightSubmitText: faker.lorem.sentence(),
          feedback: faker.lorem.sentence(),
          highlights: [faker.lorem.words(3), faker.lorem.words(3)],
          mediaUrl: Media.of(
            faker.internet.url(),
            faker.internet.url(),
            {
              format: faker.system.fileExt(),
              duration: faker.number.int({ min: 60, max: 3600 }),
              resolution: `${faker.number.int({ min: 720, max: 2160 })}p`,
              originalFileName: faker.system.fileName(),
            },
            faker.number.int({ min: 100, max: 1000 }),
          ),
        }),
      );

      await submissionMediasRepository.save(MediaFixture.createMediaEntity(submission, { ...submission.mediaUrl }));

      // when
      const response = await request(app.getHttpServer())
        .get(`/v1/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // then
      expect(response.status).toBe(200);
      expect(response.body.result).toBe('ok');
      expect(response.body.data.studentId).toBe(student.id);
      expect(response.body.data.studentName).toBe(student.name);
      expect(response.body.data.componentType).toBe(submission.componentType);
      expect(response.body.data.status).toBe(submission.status);
      expect(response.body.data.createdDt).toBeDefined();
      expect(response.body.data.updatedDt).toBeDefined();
      expect(response.body.data.submitText).toBeDefined();
      expect(response.body.data.highlightSubmitText).toBeDefined();
      expect(response.body.data.score).toBe(submission.score);
      expect(response.body.data.feedback).toBeDefined();
      expect(Array.isArray(response.body.data.highlights)).toBe(true);
      expect(response.body.data.mediaUrl).toBeDefined();
      expect(response.body.data.mediaUrl.video).toBeDefined();
      expect(response.body.data.mediaUrl.audio).toBeDefined();
    });

    it('상세 조회 - 존재하지 않는 ID 조회 시 실패', async () => {
      const invalidId = 99999999;

      const response = await request(app.getHttpServer())
        .get(`/v1/submissions/${invalidId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200); // 실패여도 status 200
      expect(response.body.result).toBe('failed');
      expect(response.body.message).toContain('제출을 찾을 수 없습니다');
    });
  });
});
