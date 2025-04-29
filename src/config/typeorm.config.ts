import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { isLocal, isTest } from '@src/common/utils/env';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const typeORMConfig = (configService: ConfigService) => {
  const host = configService.get<string>('DATABASE_HOST');

  if (!isLocal() && !isTest() && (host === 'localhost' || host === '127.0.0.1')) {
    throw new Error('[Database] Database host is not allowed');
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT'),
    username: configService.get('DATABASE_USERNAME'),
    password: configService.get('DATABASE_PASSWORD'),
    database: configService.get('DATABASE_NAME'),
    schema: configService.get('DATABASE_SCHEMA'),
    autoLoadEntities: true,
    synchronize: isLocal() || isTest(),
    // dropSchema: isLocal() || isTest(),
    // logging: isLocal(),
    logging: false,
    namingStrategy: new SnakeNamingStrategy(),
    dateStrings: true,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: 'Asia/Seoul',
  } as TypeOrmModuleAsyncOptions;
};
