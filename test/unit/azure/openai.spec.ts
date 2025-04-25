import { OpenAIService } from '@src/infra/azure/openai/service/openai.service';
import { AzureOpenAI } from 'openai';
import { Test } from '@nestjs/testing';
import { OpenAIApiException } from '@src/infra/azure/openai/exception/openai.exception';

describe('[unit] Azure OpenAI', () => {
  const mockOpeaAIClient = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  let openAIService: OpenAIService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [OpenAIService, { provide: AzureOpenAI, useValue: mockOpeaAIClient }],
    }).compile();

    openAIService = moduleRef.get<OpenAIService>(OpenAIService);
  });

  it('OpenAI의 결과가 올바른 JSON형태로 넘어온다면, Evaluation 객체를 반환한다.', async () => {
    mockOpeaAIClient.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              score: 85,
              feedback: '잘 작성했습니다.',
              highlights: ['강조1', '강조2'],
            }),
          },
        },
      ],
    });

    const result = await openAIService.evaluate('테스트 에세이');
    expect(result.score).toBe(85);
    expect(result.feedback).toContain('잘 작성');
  });

  it('잘못된 JSON 응답이면 OpenAIApiException을 던진다', async () => {
    mockOpeaAIClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '비JSON 문자열' } }],
    });

    await expect(openAIService.evaluate('에세이')).rejects.toBeInstanceOf(OpenAIApiException);
    await expect(openAIService.evaluate('에세이')).rejects.toThrow('OpenAI 응답 형식이 잘못되었습니다');
  });
});
