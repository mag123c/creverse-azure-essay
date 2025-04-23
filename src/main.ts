import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { setupAppConfig } from './bootstrap/app-initialize.config';
import { ServerBootstrap } from './bootstrap/server.config';
import { GracefulShutdown } from './bootstrap/shutdown.config';
import { AppModule } from './app/app.module';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  setupAppConfig(app);
  const server = new ServerBootstrap(app);

  // HTTP Keep-Alive 비활성화
  const httpServer = app.getHttpServer();
  httpServer.keepAliveTimeout = 0;

  // Graceful Shutdown 설정
  const shutdown = new GracefulShutdown(app, {
    onShutdown: async () => {
      server.setKeepAliveStatus(false);
    },
  });
  shutdown.setServer(httpServer);
  shutdown.setupShutdown();

  // 서버 시작
  await server.start();
}

void bootstrap();
