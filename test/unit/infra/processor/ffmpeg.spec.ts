import { Test } from '@nestjs/testing';
import { FfmpegProcessor } from '@src/infra/processor/ffmpeg.processor';
import { VideoFileFixture } from 'test/fixture/video-file.fixture';
import * as fs from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';

describe('[unit] FfmpegProcessor', () => {
  let ffmpegProcessor: FfmpegProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [FfmpegProcessor],
    }).compile();

    ffmpegProcessor = moduleRef.get(FfmpegProcessor);
  });

  afterEach(async () => {
    await VideoFileFixture.cleanupTmp();
  });

  it('process() 호출 시 muted.mp4와 audio.mp3를 생성하고, 메타데이터를 반환한다.', async () => {
    const videoFile = await VideoFileFixture.prepareTmpMulterFile('movie_1.mp4');
    const fileStat = await fs.stat(videoFile.path);
    expect(fileStat.isFile()).toBe(true);

    const { mutedVideoPath, audioPath, meta } = await ffmpegProcessor.process(videoFile.path);

    const mutedExists = await VideoFileFixture.fileExists(mutedVideoPath);
    const audioExists = await VideoFileFixture.fileExists(audioPath);

    expect(mutedExists).toBe(true);
    expect(audioExists).toBe(true);

    expect(meta).toHaveProperty('format');
    expect(meta).toHaveProperty('duration');
    expect(meta).toHaveProperty('resolution');
    expect(meta.originalFileName).toBe('movie_1.mp4');

    // 생성된 파일 디렉토리 통째로 삭제
    await fs.rm(dirname(mutedVideoPath), { recursive: true, force: true });
    expect(existsSync(dirname(mutedVideoPath))).toBe(false);
  });
});
