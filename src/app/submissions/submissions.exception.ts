import { BaseException } from '../../common/exceptions/base.exception';

export class InvalidComponentTypeException extends BaseException {
  constructor(componentType: string) {
    super(400, `잘못된 컴포넌트 타입입니다: ${componentType}`, { componentType });
  }
}

export class SubmissionNotFoundException extends BaseException {
  constructor(submissionId: string) {
    super(404, `제출을 찾을 수 없습니다: ${submissionId}`, { submissionId });
  }
}

export class DuplicateSubmissionException extends BaseException {
  constructor(componentType: string) {
    super(409, `중복된 제출이 감지되었습니다: ${componentType}`, { componentType });
  }
}
