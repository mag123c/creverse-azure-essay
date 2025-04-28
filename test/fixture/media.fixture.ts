import { Media } from '@src/app/submissions/domain/media';
import { SubmissionMediaEntity } from '@src/app/submissions/entities/submission-media.entity';
import type { SubmissionsEntity } from '@src/app/submissions/entities/submissions.entity';

export class MediaFixture {
  static createMedia() {
    return Media.of({
      videoUrl: 'videoUrl',
      audioUrl: 'audioUrl',
      meta: {
        format: 'mp4',
        duration: 120,
        resolution: '1920x1080',
        originalFileName: 'test.mp4',
      },
      latency: 0,
    });
  }

  static createMediaEntity(submission: SubmissionsEntity, partial?: Partial<SubmissionMediaEntity>) {
    const entity = new SubmissionMediaEntity();
    entity.submission = submission;
    entity.videoUrl = partial?.videoUrl ?? 'videoUrl';
    entity.audioUrl = partial?.audioUrl ?? 'audioUrl';
    entity.meta = partial?.meta ?? {
      format: 'mp4',
      duration: 120,
      resolution: '1920x1080',
      originalFileName: 'test.mp4',
    };
    return entity;
  }
}
