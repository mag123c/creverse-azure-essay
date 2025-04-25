import compression from 'compression';
import { setupCors } from './cors.config';
import { setupPipe } from './global-pipe.config';
import { setupSwagger } from './swagger.config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggingInterceptor } from '@src/common/interceptor/logging.interceptor';
import { HttpExceptionFilter } from '@src/common/filter/http-exception.filter';
import { LatencyInterceptor } from '@src/common/interceptor/latency.interceptor';

export const setupAppConfig = async (app: NestExpressApplication) => {
  app.use(compression());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new LatencyInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  setupCors(app);
  setupPipe(app);
  setupSwagger(app);
};
