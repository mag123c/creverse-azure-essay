import { Injectable, Logger } from '@nestjs/common';
import { BlobStorageService } from '@src/infra/azure/blob/service/blob-storage.service';
import { Media } from '../domain/media';
import { FfmpegProcessor } from '@src/infra/processor/ffmpeg.processor';
import * as fs from 'fs/promises';

@Injectable()
export class SubmissionMediaUploader {
  private readonly logger = new Logger(SubmissionMediaUploader.name);

  constructor(
    private readonly ffmpeg: FfmpegProcessor,
    private readonly blobStorage: BlobStorageService,
  ) {}

  async upload(videoFile?: Express.Multer.File): Promise<Media | null> {
    if (!videoFile) {
      return null;
    }

    this.logger.log(`영상 처리 시작: ${videoFile.originalname}`);

    const start = Date.now();
    try {
      const { mutedVideoPath, audioPath, meta } = await this.ffmpeg.process(videoFile.path);

      const video = await this.blobStorage.uploadFileFromPath(mutedVideoPath, 'video/mp4');
      const audio = await this.blobStorage.uploadFileFromPath(audioPath, 'audio/mp3');

      const latency = Date.now() - start;
      this.logger.log(`영상 업로드 완료 (${latency}ms)`);

      return Media.of(video.sasUrl, audio.sasUrl, meta);
    } catch (e: any) {
      this.logger.error(`영상 처리 실패: ${e.message}`, e.stack);
      throw e;
    } finally {
      // 영상 파일 삭제
      try {
        await fs.unlink(videoFile.path);
        this.logger.log(`영상 파일 삭제 완료: ${videoFile.path}`);
      } catch (e: any) {
        this.logger.error(`영상 파일 삭제 실패: ${e.message}`, e.stack);
      }
    }
  }
}
