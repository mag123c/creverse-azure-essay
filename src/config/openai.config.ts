import type { ConfigService } from '@nestjs/config';

export const openAIConfig = (configService: ConfigService) => {
  return {
    endopint: configService.get('AZURE_OPENAI_ENDPOINT'),
    key: configService.get('AZURE_ENDPOINT_KEY'),
    deployment: configService.get('AZURE_OPENAI_DEPLOYMENT_NAME'),
    apiVersion: configService.get('AZURE_OPEN_API_VERSION'),
  };
};
