import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Student } from '@src/app/students/domain/student';

export const JwtDecoded = createParamDecorator((data: unknown, context: ExecutionContext) => {
  return fetchUserFromJwt(context.switchToHttp().getRequest());
});

export const fetchUserFromJwt = (req: any) => {
  if (req.user) {
    return Student.ofDecodedToken(req.user);
  }

  return null;
};
