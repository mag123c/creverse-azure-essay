import { BaseException } from '../../../common/exceptions/base.exception';

export class AlreadyEvaluatingException extends BaseException {
  constructor(submissionId: number) {
    super(400, `이미 평가중인 제출입니다: ${submissionId}`, { submissionId });
  }
}

export class RevisionsNotFoundException extends BaseException {
  constructor(submissionId: number) {
    super(404, `학생(${submissionId}) 의 제출을 찾을 수 없습니다`, { submissionId });
  }
}
