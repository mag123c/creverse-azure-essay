import type { INestApplication } from '@nestjs/common';
import type { SwaggerCustomOptions } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = () => {
  return new DocumentBuilder()
    .setTitle('프리랜서 API')
    .setVersion('SETVERSION')
    .addBasicAuth(
      {
        type: 'apiKey',
        scheme: 'X-Nonce',
        name: 'X-Nonce',
        in: 'header',
      },
      'X-Nonce',
    )
    .build();
};

export const setupSwagger = (app: INestApplication) => {
  const document = SwaggerModule.createDocument(app, swaggerConfig(), {});
  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      ui: true, // UI
      raw: false, // json, yaml falsy
      tagsSorter: 'alpha',
    },
  };

  SwaggerModule.setup('/docs', app, document, swaggerOptions);
};
