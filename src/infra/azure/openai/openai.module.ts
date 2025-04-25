import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';
import { OpenAIService } from './service/openai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AzureOpenAI,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('AZURE_ENDPOINT_KEY')!;
        const endpoint = config.get<string>('AZURE_ENDPOINT_URL')!;
        const deployment = config.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME')!;
        const apiVersion = config.get<string>('AZURE_OPEN_API_VERSION')!;
        return new AzureOpenAI({
          apiKey,
          endpoint,
          deployment,
          apiVersion,
        });
      },
    },
    OpenAIService,
  ],
  exports: [OpenAIService],
})
export class OpenAIModule {}
