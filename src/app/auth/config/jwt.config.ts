import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (configService: ConfigService) => {
  return {
    signOptions: {
      expiresIn: configService.get('EXPIRES_IN'),
      algorithm: configService.get('JWT_ALGORITHM'),
    },
    secret: configService.get('JWT_SECRET'),
  } as JwtModuleOptions;
};
