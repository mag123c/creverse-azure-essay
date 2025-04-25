import { Injectable } from '@nestjs/common';
import { AzureOpenAI } from 'openai';
import { buildSubmissionFeedbackPrompt } from '../prompts/submission-feedback.prompt';
import { OpenAIApiException } from '../exception/openai.exception';
import { Evaluation } from '@src/app/submissions/domain/evaluation';

@Injectable()
export class OpenAIService {
  private readonly model!: string;
  constructor(private readonly client: AzureOpenAI) {
    this.model = this.client.deploymentName!;
  }

  /**
   * OpenAI API를 사용하여 학생의 에세이를 평가합니다.
   *  - 평가 결과는 JSON 형식으로 반환됩니다.
   */
  async evaluate(submitText: string): Promise<Evaluation> {
    // 평가를 위한 프롬프트 생성
    const messages = buildSubmissionFeedbackPrompt(submitText);

    try {
      const response = await this.client.chat.completions.create({
        messages,
        model: this.model,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const content = response.choices?.[0]?.message?.content;

      return Evaluation.fromJson(JSON.parse(content ?? '{}'));
    } catch (e: any) {
      throw new OpenAIApiException(submitText, e?.response?.data ?? e.message);
    }
  }
}
