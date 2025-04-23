import compression from 'compression';
import { setupCors } from './cors.config';
import { setupPipe } from './global-pipe.config';
import { setupSwagger } from './swagger.config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

export const setupAppConfig = async (app: NestExpressApplication) => {
  app.use(compression());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  setupCors(app);
  setupPipe(app);
  setupSwagger(app);
};
