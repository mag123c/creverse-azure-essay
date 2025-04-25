import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { StudentsService } from '@src/app/students/service/students.service';
import { JwtUnauthorizedException } from '@src/common/exceptions/auth.exception';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly studentsService: StudentsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: [configService.get('JWT_ALGORITHM')!],
      secretOrKey: configService.get('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    const student = await this.studentsService.findById(payload.id);
    if (!student) {
      throw new JwtUnauthorizedException();
    }

    return { ...payload };
  }
}
