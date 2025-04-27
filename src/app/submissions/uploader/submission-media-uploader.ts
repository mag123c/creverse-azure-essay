import { Injectable, Logger } from '@nestjs/common';
import { BlobStorageService } from '@src/infra/azure/blob/service/blob-storage.service';
import { FileMetadata, Media } from '../domain/media';
import { FfmpegProcessor } from '@src/infra/processor/ffmpeg.processor';
import { Submission } from '../domain/submission';
import * as fs from 'fs/promises';
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
    let uploadSuccess = false;

    try {
      const result = await this.ffmpeg.process(videoPath);
      mutedPath = result.mutedVideoPath;
      audioPath = result.audioPath;
      const meta = result.meta;

      const video = await this.blobStorage.uploadFileFromPath(mutedPath, 'video/mp4');
      const audio = await this.blobStorage.uploadFileFromPath(audioPath, 'audio/mp3');

      this.logger.log(`영상 업로드 완료`);
      uploadSuccess = true;
      submission.setMedia(Media.of(video.sasUrl, audio.sasUrl, meta, Date.now() - start));
    } catch (e: any) {
      submission.setMedia(Media.of('', '', {} as FileMetadata, Date.now() - start));
      this.logger.warn(`영상 처리 실패: ${e.message}`);
    } finally {
      // 변환된 muted, audio 파일은 항상 삭제
      if (mutedPath) {
        try {
          await fs.unlink(mutedPath);
          this.logger.log(`변환된 음소거 영상 파일 삭제 완료: ${mutedPath}`);
        } catch (err: any) {
          this.logger.warn(`변환된 음소거 영상 파일 삭제 실패 (${mutedPath}): ${err.message}`);
        }
      }
      if (audioPath) {
        try {
          await fs.unlink(audioPath);
          this.logger.log(`변환된 오디오 파일 삭제 완료: ${audioPath}`);
        } catch (err: any) {
          this.logger.warn(`변환된 오디오 파일 삭제 실패 (${audioPath}): ${err.message}`);
        }
      }

      // 원본 파일은 업로드 성공했을 때만 삭제
      if (uploadSuccess) {
        try {
          await fs.unlink(videoPath);
          this.logger.log(`원본 영상 파일 삭제 완료: ${videoPath}`);
        } catch (err: any) {
          this.logger.warn(`원본 영상 파일 삭제 실패 (${videoPath}): ${err.message}`);
        }
      }
    }
  }
}
