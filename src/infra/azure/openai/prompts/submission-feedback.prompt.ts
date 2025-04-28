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
    // content: `You are an English writing evaluator. Return a JSON with score (0~10), feedback, highlights[].`,
    content: [
      `You are an English writing evaluator.`,
      `Return a JSON with these fields:`,
      `  • score: integer from 0 to 10`,
      `  • feedback: overall comments`,
      `  • highlights: array of sentences or words where points were deducted`,
      ``,
      `IMPORTANT:`,
      `  – If the score is 10 (a perfect score), return highlights as an empty array ([]).`,
      `  – Otherwise, include only the parts that caused deductions in highlights.`,
    ].join('\n'),
  },
  {
    role: 'user',
    content: `Essay: ${essay}`,
  },
];
