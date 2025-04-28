import { BaseException } from '../../../common/exceptions/base.exception';

export class InvalidComponentTypeException extends BaseException {
  constructor(componentType: string) {
    super(400, `잘못된 컴포넌트 타입입니다: ${componentType}`, { componentType });
  }
}

export class AlreadyRevisedSubmissionException extends BaseException {
  constructor(submissionId: number) {
    super(400, `이미 재평가된 제출입니다: ${submissionId}`, { submissionId });
  }
}

export class AlreadyEvaluatedException extends BaseException {
  constructor(submissionId: number) {
    super(400, `이미 평가된 제출입니다: ${submissionId}`, { submissionId });
  }
}
export class SubmissionNotFoundException extends BaseException {
  constructor(submissionId: number) {
    super(404, `학생(${submissionId}) 의 제출을 찾을 수 없습니다`, { submissionId });
  }
}

export class DuplicateSubmissionException extends BaseException {
  constructor(userId: number, componentType: string) {
    super(409, `중복된 제출이 감지되었습니다`, { userId, componentType });
  }
}
