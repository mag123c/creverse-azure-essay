import type { DynamicModule, INestApplication, Provider, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { type TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/app/app.module';
import { setupPipe } from '@src/bootstrap/global-pipe.config';
import { HttpExceptionFilter } from '@src/common/filter/http-exception.filter';
import { envConfig } from '@src/config';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

export const setupModule = async (
  modules: Array<Type<any> | DynamicModule | Promise<DynamicModule>>,
  providers?: Array<Type<any> | Provider>,
  controllers?: Array<Type<any> | any>,
  mocks?: Array<{ provide: any; useValue: any }>,
): Promise<TestingModule> => {
  if (modules.includes(CustomDatabaseModule) || modules.includes(AppModule)) {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
  }
  const moduleRef = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        ...envConfig(),
      }),
      ...modules,
    ],
    providers: [...(providers ?? [])],
    controllers: [...(controllers ?? [])],
  });

  if (mocks) {
    mocks.forEach((mock) => moduleRef.overrideProvider(mock.provide).useValue(mock.useValue));
  }

  return await moduleRef.compile();
};

export const setupApp = async (app: INestApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter());
  setupPipe(app);
  await app.init();
};
