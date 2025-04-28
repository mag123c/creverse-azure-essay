import type {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
} from 'openai/resources';

export const buildSubmissionFeedbackPrompt = (
  essay: string,
): (ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam)[] => [
  {
    role: 'system',
    content: `You are an English writing evaluator. Return a JSON with score (0~10), feedback, highlights[].`,
  },
  {
    role: 'user',
    content: `Essay: ${essay}`,
  },
];
