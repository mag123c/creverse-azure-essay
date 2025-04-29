import type { INestApplication } from '@nestjs/common';
import { setupApp, setupJWT, setupModule, setupStudent } from 'test/setup';
import { StudentsRepository } from '@src/app/students/repositories/students.repository';
import { StudentsModule } from '@src/app/students/students.module';
import { SubmissionsModule } from '@src/app/submissions/submissions.module';
import { RevisionsModule } from '@src/app/revisions/revisions.module';
import { SubmissionQueueModule } from '@src/infra/queue/submissions/submission-queue.module';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { AuthModule } from '@src/app/auth/auth.module';
import { SubmissionsRepository } from '@src/app/submissions/repositories/submissions.repository';
import { SubmissionLogsRepository } from '@src/app/submissions/repositories/submission-logs.repository';
import { RevisionsRepository } from '@src/app/revisions/repositories/revisions.repository';
import { faker } from '@faker-js/faker';
import { SubmissionsFixture } from 'test/fixture/submissions.fixture';
import { RevisionsFixture } from 'test/fixture/revisions.fixture';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import request from 'supertest';
import type { StudentsEntity } from '@src/app/students/entities/students.entity';
import { RevisionsNotFoundException } from '@src/app/revisions/exception/revisions.exception';

type QueryOption = {
  desc: string;
  query: {
    status?: string;
    sort?: string;
    page?: number;
    size?: number;
  };
};

describe('[e2e] Revisions', () => {
  let app: INestApplication;

  let studentsRepository: StudentsRepository;
  let submissionsRepository: SubmissionsRepository;
  let submissionLogsRepository: SubmissionLogsRepository;
  let revisionsRepository: RevisionsRepository;

  let student: StudentsEntity;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await setupModule([
      StudentsModule,
      SubmissionsModule,
      RevisionsModule,
      SubmissionQueueModule,
      CustomDatabaseModule,
      AuthModule,
    ]);
    app = moduleRef.createNestApplication();
    await setupApp(app);

    studentsRepository = moduleRef.get(StudentsRepository);
    submissionsRepository = moduleRef.get(SubmissionsRepository);
    submissionLogsRepository = moduleRef.get(SubmissionLogsRepository);
    revisionsRepository = moduleRef.get(RevisionsRepository);

    student = await setupStudent(app);
    accessToken = await setupJWT(app, student);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await revisionsRepository.delete({});
    await submissionsRepository.delete({});
    await submissionLogsRepository.delete({});
  });

  afterAll(async () => {
    await studentsRepository.delete({});
    await app.close();
  });

  describe('GET /v1/revisions (pagination & filter)', () => {
    it.each<QueryOption>([
      { desc: '기본 조회', query: {} },
      { desc: `상태 필터: ${SubmissionStatus.SUCCESS}`, query: { status: SubmissionStatus.SUCCESS } },
      { desc: `상태 필터: ${SubmissionStatus.FAILED}`, query: { status: SubmissionStatus.FAILED } },
      { desc: '정렬 기준 변경 (createdDt ASC)', query: { sort: 'createdDt,ASC' } },
    ])('$desc', async ({ query }) => {
      const total = faker.number.int({ min: 30, max: 50 });
      const revisions = [];

      for (let i = 0; i < total; i++) {
        const status = faker.helpers.arrayElement(Object.values(SubmissionStatus));
        const submission = await submissionsRepository.save(
          SubmissionsFixture.creatSubmissionEntity(student, { status }, i),
        );
        const revision = RevisionsFixture.createRevisionEntity(submission);
        revisions.push(revision);
      }

      await revisionsRepository.save(revisions);

      const response = await request(app.getHttpServer())
        .get('/v1/revisions')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('ok');

      const { meta, data } = response.body;

      // meta 검증
      expect(typeof meta.total).toBe('number');
      expect(typeof meta.currentPage).toBe('number');
      expect(typeof meta.perPage).toBe('number');
      expect(typeof meta.hasNext).toBe('boolean');

      // data 배열 검증
      for (const item of data) {
        expect(item).toMatchObject({
          id: expect.any(Number),
          submissionId: expect.any(Number),
          studentId: expect.any(Number),
          studentName: expect.any(String),
          componentType: expect.any(String),
          status: expect.any(String),
          createdDt: expect.any(String),
        });

        if (item.score !== undefined) {
          expect(typeof item.score).toBe('number');
        }

        if (query.status) {
          expect(item.status).toBe(query.status);
        }
      }

      if (query.sort === 'createdDt,ASC') {
        for (let i = 1; i < data.length; i++) {
          const prev = new Date(data[i - 1].createdDt);
          const curr = new Date(data[i].createdDt);
          expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
        }
      }
    });

    it('조회 결과가 없으면 빈 배열을 가져온다.', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/revisions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('ok');
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /v1/revisions/:revisionId (detail)', () => {
    it('상세 조회 - 정상 조회', async () => {
      const submission = await submissionsRepository.save(SubmissionsFixture.creatSubmissionEntity(student));
      const revision = await revisionsRepository.save(RevisionsFixture.createRevisionEntity(submission));

      const response = await request(app.getHttpServer())
        .get(`/v1/revisions/${submission.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('ok');

      const data = response.body.data;

      expect(data).toMatchObject({
        id: revision.id,
        submissionId: submission.id,
        studentId: student.id,
        studentName: student.name,
        componentType: revision.componentType,
        status: revision.status,
        submitText: revision.submitText,
        createdDt: expect.any(String),
      });

      if (revision.feedback) {
        expect(typeof data.feedback).toBe('string');
      }
      if (revision.highlightSubmitText) {
        expect(typeof data.highlightSubmitText).toBe('string');
      }
      if (revision.highlights) {
        expect(Array.isArray(data.highlights)).toBe(true);
      }
      if (submission.media) {
        expect(data.mediaUrl).toMatchObject({
          video: expect.any(String),
          audio: expect.any(String),
        });
      }
    });

    it('상세 조회 - 존재하지 않는 ID 조회 시 실패', async () => {
      const invalidId = 9999999;

      const response = await request(app.getHttpServer())
        .get(`/v1/revisions/${invalidId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('failed');
      expect(response.body.message).toContain(new RevisionsNotFoundException(invalidId).message);
    });
  });
});
