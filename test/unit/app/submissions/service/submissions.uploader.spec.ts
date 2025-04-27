import { SubmissionMediaUploader } from '@src/app/submissions/uploader/submission-media-uploader';
import { FfmpegProcessor } from '@src/infra/processor/ffmpeg.processor';
import { BlobStorageService } from '@src/infra/azure/blob/service/blob-storage.service';
import { Submission } from '@src/app/submissions/domain/submission';
import { Test } from '@nestjs/testing';
import { Media } from '@src/app/submissions/domain/media';
import * as fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

describe('[unit] SubmissionMediaUploader', () => {
  const mockFfmpeg = { process: jest.fn() };
  const mockBlob = { uploadFileFromPath: jest.fn() };

  let uploader: SubmissionMediaUploader;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmissionMediaUploader,
        { provide: FfmpegProcessor, useValue: mockFfmpeg },
        { provide: BlobStorageService, useValue: mockBlob },
      ],
    }).compile();

    uploader = moduleRef.get(SubmissionMediaUploader);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('업로드 성공 시 Media를 설정한다.', async () => {
    mockFfmpeg.process.mockResolvedValue({
      mutedVideoPath: '/tmp/muted.mp4',
      audioPath: '/tmp/audio.mp3',
      meta: { format: 'mp4', duration: 60, resolution: '1920x1080', originalFileName: 'test.mp4' },
    });
    mockBlob.uploadFileFromPath.mockResolvedValue({ sasUrl: 'video-url', url: '' });
    const submission = Submission.create(1, '홍길동', 'essay', 'submit');

    await uploader.upload(submission, '/tmp/video.mp4');

    expect(submission.getMedia()).toBeInstanceOf(Media);
    expect(submission.getMedia()!.getVideoUrl()).toBe('video-url');
    expect(mockFfmpeg.process).toHaveBeenCalled();
    expect(mockBlob.uploadFileFromPath).toHaveBeenCalled();
  });

  it('ffmpeg 처리 실패 시 빈 Media를 설정하고 정상 종료한다.', async () => {
    mockFfmpeg.process.mockRejectedValue(new Error('ffmpeg error'));
    const submission = Submission.create(1, '홍길동', 'essay', 'submit');

    await uploader.upload(submission, '/tmp/video.mp4');

    expect(submission.getMedia()).toBeInstanceOf(Media);
    expect(submission.getMedia()!.getVideoUrl()).toBe('');
    expect(submission.getMedia()!.getAudioUrl()).toBe('');
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/video.mp4');
  });
});
