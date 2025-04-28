import { BaseException } from '@src/common/exceptions/base.exception';

export class JwtExpiredException extends BaseException {
  constructor() {
    super(401, 'JWT가 만료되었습니다.');
  }
}

export class JwtUnauthorizedException extends BaseException {
  constructor() {
    super(401, '인증되지 않은 요청입니다.');
  }
}

export class StudentNotFoundException extends BaseException {
  constructor() {
    super(404, '학생을 찾을 수 없습니다.');
  }
}
