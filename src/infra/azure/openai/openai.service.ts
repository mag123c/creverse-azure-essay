import { Inject, Injectable } from '@nestjs/common';
import { AzureOpenAI } from 'openai';
import { buildSubmissionFeedbackPrompt } from './prompts/submission-feedback.prompt';
import { OpenAIApiException } from './exception/openai.exception';

@Injectable()
export class OpenAIService {
  constructor(
    @Inject(AzureOpenAI)
    private readonly client: AzureOpenAI,
  ) {}

  async generateSubmissionFeedback(submitText: string): Promise<{
    score: number;
    feedback: string;
    highlights: string[];
  }> {
    const messages = buildSubmissionFeedbackPrompt(submitText);

    const response = await this.client.chat.completions.create({
      messages,
      model: this.client.deploymentName as string,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = response.choices?.[0]?.message?.content;

    try {
      return JSON.parse(content ?? '{}');
    } catch {
      throw new OpenAIApiException(submitText, content);
    }
  }
}
