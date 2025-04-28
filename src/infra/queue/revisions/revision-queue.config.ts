import type { RegisterQueueOptions } from '@nestjs/bullmq';
import type { ConfigService } from '@nestjs/config';

export const revisionQueueOptions = (configService: ConfigService, name: string) =>
  ({
    name,
    connection: {
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      password: configService.get<string>('REDIS_PASSWORD'),
    },
    defaultJobOptions: {
      removeOnComplete: { age: 60 * 60 * 24 * 1 },
      removeOnFail: false,
      attempts: 1, // 즉시 실행, 재시도 없음
    },
    debug: true,
  }) as RegisterQueueOptions;
