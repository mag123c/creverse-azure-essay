import { BaseException } from '@src/common/exceptions/base.exception';

export class OpenAIApiException extends BaseException {
  constructor(submitText: string, content: string | null) {
    super(500, 'OpenAI 응답 형식이 잘못되었습니다', {
      submitText,
      content,
    });
  }
}
