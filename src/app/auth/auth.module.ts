import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { jwtConfig } from '@src/config';
import { AuthService } from './auth.service';
import { JWTService } from './jwt/jwt.service';
import { AuthController } from './auth.controller';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtConfig,
    }),
    StudentsModule,
  ],
  providers: [AuthService, JWTService, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
