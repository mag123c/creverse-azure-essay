import { BaseException } from '../../../common/exceptions/base.exception';

export class AlreadyEvaluatingException extends BaseException {
  constructor(submissionId: number) {
    super(400, `이미 평가중인 제출(${submissionId})입니다`, { submissionId });
  }
}

export class RevisionsNotFoundException extends BaseException {
  constructor(submissionId: number) {
    super(404, `학생의 재평가(${submissionId})을 찾을 수 없습니다`, { submissionId });
  }
}
