import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/logging/logger.module';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from '@src/config';
import { CustomDatabaseModule } from '@src/infra/database/database.module';
import { OpenAIModule } from '@src/infra/azure/openai/openai.module';

@Module({
  imports: [
    // Default Setting
    ConfigModule.forRoot({
      ...envConfig(),
    }),
    LoggerModule,

    // Infra
    CustomDatabaseModule,
    OpenAIModule,
  ],
})
export class AppModule {}
