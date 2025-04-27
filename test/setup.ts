import type { DynamicModule, INestApplication, Provider, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { type TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/app/app.module';
import { setupPipe } from '@src/bootstrap/global-pipe.config';
import { HttpExceptionFilter } from '@src/common/filter/http-exception.filter';
import { envConfig } from '@src/config';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { StudentFixture } from './fixture/student.fixture';
import type { StudentsEntity } from '@src/app/students/entities/students.entity';
import type { JwtResponse } from '@src/app/auth/auth.dto';
import { StudentsRepository } from '@src/app/students/repositories/students.repository';
import { JWTService } from '@src/app/auth/jwt/jwt.service';
import { LoggingInterceptor } from '@src/common/interceptor/logging.interceptor';

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
  app.useGlobalInterceptors(new LoggingInterceptor());
  setupPipe(app);
  await app.init();
};

export const setupStudent = async (app: INestApplication): Promise<StudentsEntity> => {
  const student = StudentFixture.createMockStudentEntity();
  const studentRepository = app.get(StudentsRepository);
  return await studentRepository.save(student);
};

export const setupJWT = async (app: INestApplication, student: StudentsEntity): Promise<string> => {
  const jwtService = app.get(JWTService);
  const jwt: JwtResponse = await jwtService.createToken(student);
  return jwt.accessToken;
};
