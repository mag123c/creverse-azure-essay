import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { BlobStorageService } from './service/blob-storage.service';
import { FfmpegProcessor } from '@src/infra/processor/ffmpeg.processor';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'BLOB_CREDENTIAL',
      useFactory: (config: ConfigService) => {
        return new StorageSharedKeyCredential(
          config.get<string>('AZURE_ACCOUNT_NAME')!,
          config.get<string>('AZURE_ACCOUNT_KEY')!,
        );
      },
      inject: [ConfigService],
    },
    {
      provide: 'BLOB_CLIENT',
      useFactory: (config: ConfigService, credential: StorageSharedKeyCredential) => {
        const account = config.get<string>('AZURE_ACCOUNT_NAME')!;
        return new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
      },
      inject: [ConfigService, 'BLOB_CREDENTIAL'],
    },
    {
      provide: 'BLOB_CONTAINER',
      useFactory: (config: ConfigService) => config.get<string>('AZURE_CONTAINER')!,
      inject: [ConfigService],
    },
    BlobStorageService,
    FfmpegProcessor,
  ],
  exports: [BlobStorageService, FfmpegProcessor],
})
export class BlobStorageModule {}
