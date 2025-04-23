import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtExpiredException, JwtUnauthorizedException } from '../../common/exceptions/auth.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: { message: string }) {
    //토큰 만료 시 에러
    if (info?.message === 'jwt expired') {
      throw new JwtExpiredException();
    }
    if (err || !user) {
      //인가 실패
      throw new JwtUnauthorizedException();
    }
    return user;
  }
}
