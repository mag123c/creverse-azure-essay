import { Injectable, Logger } from '@nestjs/common';
import { BlobStorageService } from '@src/infra/azure/blob/service/blob-storage.service';
import { FileMetadata, Media } from '../domain/media';
import { FfmpegProcessor } from '@src/infra/processor/ffmpeg.processor';
import * as fs from 'fs/promises';
import { Submission } from '../domain/submission';

@Injectable()
export class SubmissionMediaUploader {
  private readonly logger = new Logger(SubmissionMediaUploader.name);

  constructor(
    private readonly ffmpeg: FfmpegProcessor,
    private readonly blobStorage: BlobStorageService,
  ) {}

  async upload(submission: Submission, videoPath?: string): Promise<void> {
    if (!videoPath) {
      return;
    }

    this.logger.log(`ID: ${submission.getId()}의 제출된 영상 처리 시작`);

    const start = Date.now();
    let mutedPath: string | undefined;
    let audioPath: string | undefined;

    try {
      const result = await this.ffmpeg.process(videoPath);
      mutedPath = result.mutedVideoPath;
      audioPath = result.audioPath;
      const meta = result.meta;

      const video = await this.blobStorage.uploadFileFromPath(mutedPath, 'video/mp4');
      const audio = await this.blobStorage.uploadFileFromPath(audioPath, 'audio/mp3');

      this.logger.log(`영상 업로드 완료`);
      submission.setMedia(Media.of(video.sasUrl, audio.sasUrl, meta, Date.now() - start));
    } catch (e: any) {
      submission.setMedia(Media.of('', '', {} as FileMetadata, Date.now() - start));
      this.logger.error(`영상 처리 실패: ${e.message}`, e.stack);
      throw e;
    } finally {
      // 파일 정리: 원본, muted, audio
      const pathsToDelete = [videoPath, mutedPath, audioPath].filter((p): p is string => typeof p === 'string');
      for (const p of pathsToDelete) {
        try {
          await fs.unlink(p);
          this.logger.log(`임시 파일 삭제 완료: ${p}`);
        } catch (err: any) {
          this.logger.error(`임시 파일 삭제 실패 (${p}): ${err.message}`, err.stack);
        }
      }
    }
  }
}
