import { Test } from '@nestjs/testing';
import { SubmissionEvaluator } from '@src/app/submissions/service/submissions.evaluator';
import { OpenAIService } from '@src/infra/azure/openai/service/openai.service';
import { Submission } from '@src/app/submissions/domain/submission';
import { Evaluation } from '@src/app/submissions/domain/evaluation';
import { EvaluationFixture } from 'test/fixture/evaluation.fixture';

describe('[unit] SubmissionEvaluator', () => {
  let evaluator: SubmissionEvaluator;
  let openAIService: OpenAIService;

  const mockOpenAIService = {
    evaluate: jest.fn(),
  };

  beforeAll(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [SubmissionEvaluator, { provide: OpenAIService, useValue: mockOpenAIService }],
    }).compile();

    evaluator = moduleRef.get(SubmissionEvaluator);
    openAIService = moduleRef.get(OpenAIService);
  });

  it('Submission을 평가하여 Evaluation을 반환한다.', async () => {
    const submission = Submission.create(1, '홍길동', 'Essay Writing', 'This is a test.');
    mockOpenAIService.evaluate.mockResolvedValue(EvaluationFixture.createEvaluation());

    await evaluator.evaluate(submission);
    const evaluation = submission.getEvaluation();

    expect(openAIService.evaluate).toHaveBeenCalledWith(submission.getSubmitText());
    expect(evaluation).toBeInstanceOf(Evaluation);
    expect(evaluation?.getScore()).toBe(90);
    expect(evaluation?.getFeedback()).toContain('Good');
  });

  it('학생 이름과 ID를 로그에 기록한다.', async () => {
    const submission = Submission.create(1, '홍길동', 'Essay Writing', 'This is a test.');
    mockOpenAIService.evaluate.mockResolvedValue(EvaluationFixture.createEvaluation());

    const logSpy = jest.spyOn(evaluator['logger'], 'log');
    await evaluator.evaluate(submission);

    expect(logSpy).toHaveBeenCalledWith(`학생 ${submission.getStudentName()}(${submission.getStudentId()}) 평가 시작`);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('학생 1 평가 완료'));
  });
});
