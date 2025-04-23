import type { INestApplication } from '@nestjs/common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { isProduction, isTest } from '@src/common/utils/env';

export const setupPipe = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
      disableErrorMessages: isProduction(),
      skipMissingProperties: false,
      exceptionFactory: (errors) => {
        if (!isProduction() && !isTest()) {
          console.error(errors);
        }
        return new BadRequestException(
          isProduction()
            ? 'Invalid request parameters'
            : errors.map((err) => ({
                property: err.property,
                constraints: err.constraints,
              })),
        );
      },
    }),
  );
};
