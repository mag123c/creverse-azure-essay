import type { INestApplication } from '@nestjs/common';

export const setupCors = (app: INestApplication) => {
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-Nonce'],
    exposeHeaders: ['X-Nonce'],
  });
};
