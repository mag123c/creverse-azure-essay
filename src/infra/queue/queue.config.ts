import type { RegisterQueueOptions } from '@nestjs/bullmq';
import type { ConfigService } from '@nestjs/config';

export const submissionQueueOptions = (configService: ConfigService, name: string) =>
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
      attempts: 1, // 최초 실패에만 재시도
    },
    debug: true,
  }) as RegisterQueueOptions;
