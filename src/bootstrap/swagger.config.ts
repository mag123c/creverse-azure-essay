import type { INestApplication } from '@nestjs/common';
import type { SwaggerCustomOptions } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorResponseDto } from '@src/common/response/api-response.dto';

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
  const document = SwaggerModule.createDocument(app, swaggerConfig(), {
    extraModels: [ErrorResponseDto], // 에러 디폴트 포맷
  });

  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      ui: true, // UI
      raw: true,
    },
  };

  SwaggerModule.setup('/docs', app, document, swaggerOptions);
};
