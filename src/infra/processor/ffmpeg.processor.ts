import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { join } from 'path';
import * as fs from 'fs/promises';
import { FileMetadata } from '@src/app/submissions/domain/media';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class FfmpegProcessor {
  async process(inputPath: string): Promise<{
    mutedVideoPath: string;
    audioPath: string;
    meta: FileMetadata;
  }> {
    const outputDir = join(process.cwd(), 'tmp');
    await fs.mkdir(outputDir, { recursive: true });

    const mutedVideoPath = join(outputDir, 'muted.mp4');
    const audioPath = join(outputDir, 'audio.mp3');

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        // 비디오 스트림 → muted.mp4
        .output(mutedVideoPath)
        .videoFilters('crop=iw/2:ih:iw/2:0')
        .videoCodec('libx264')
        .noAudio()
        // 오디오 스트림 → audio.mp3
        .output(audioPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .outputOptions('-q:a', '2')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    const metadata = await this.getMetadata(inputPath);

    return {
      mutedVideoPath,
      audioPath,
      meta: metadata,
    };
  }

  private async getMetadata(inputPath: string): Promise<FileMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) return reject(err);

        const videoStream = data.streams.find((s) => s.codec_type === 'video');
        const format = data.format.format_name;
        const duration = data.format.duration;
        const resolution = videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown';

        resolve({
          format,
          duration,
          resolution,
          originalFileName: inputPath.split('/').pop() ?? '',
        });
      });
    });
  }
}
