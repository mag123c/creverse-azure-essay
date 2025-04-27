import { DuplicateSubmissionException } from '@src/app/submissions/exception/submissions.exception';
import { SubmissionsService } from '@src/app/submissions/service/submissions.service';
import { SubmissionsRepository } from '@src/app/submissions/repositories/submissions.repository';
import { type TestingModule, Test } from '@nestjs/testing';
import { SubmissionEvaluator } from '@src/app/submissions/service/submissions.evaluator';
import { SubmissionMediaUploader } from '@src/app/submissions/uploader/submission-media-uploader';
import type { SubmissionsRequestDto } from '@src/app/submissions/dto/submissions-request.dto';
import { StudentFixture } from 'test/fixture/student.fixture';
import { SubmissionProducer } from '@src/infra/queue/submissions/submission.producer';
import { SubmissionLogsRepository } from '@src/app/submissions/repositories/submission-logs.repository';
import { SubmissionMediaRepository } from '@src/app/submissions/repositories/submission-media.repository';
import { SubmissionsFixture } from 'test/fixture/submissions.fixture';
import type { StudentsEntity } from '@src/app/students/entities/students.entity';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
}));

describe('[unit] SubmissionsService', () => {
  let submissionService: SubmissionsService;
  const submissionsRepository = {
    findOneByStudentIdAndComponentType: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const submissionProducer = {
    enqueueSubmissionEvaluation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: SubmissionEvaluator, useValue: {} },
        { provide: SubmissionMediaUploader, useValue: {} },
        { provide: SubmissionProducer, useValue: submissionProducer },
        { provide: SubmissionsRepository, useValue: submissionsRepository },
        { provide: SubmissionLogsRepository, useValue: {} },
        { provide: SubmissionMediaRepository, useValue: {} },
      ],
    }).compile();

    submissionService = module.get<SubmissionsService>(SubmissionsService);
  });

  it('학생이 이미 동일한 componentType 으로 제출한 이력이 있으면 DuplicateSubmissionException 을 던진다', async () => {
    const student = StudentFixture.createMockStudent();
    const dto: SubmissionsRequestDto = {
      componentType: 'Essay Writing',
      submitText: '테스트 에세이',
    };

    submissionsRepository.findOneByStudentIdAndComponentType.mockResolvedValue(
      SubmissionsFixture.creatSubmissionEntity({ id: student.id, name: student.name } as StudentsEntity),
    );

    await expect(submissionService.generateSubmissionFeedback(student, dto)).rejects.toBeInstanceOf(
      DuplicateSubmissionException,
    );

    expect(submissionsRepository.findOneByStudentIdAndComponentType).toHaveBeenCalledWith(
      student.id,
      dto.componentType,
    );
    expect(submissionProducer.enqueueSubmissionEvaluation).not.toHaveBeenCalled();
  });
});
