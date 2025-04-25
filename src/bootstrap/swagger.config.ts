import type { INestApplication } from '@nestjs/common';
import type { SwaggerCustomOptions } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = () => {
  return new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('API Docs')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'accessToken',
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
