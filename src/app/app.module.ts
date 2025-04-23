import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from '@src/logging/logger.module';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from '@src/config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...envConfig(),
    }),
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
