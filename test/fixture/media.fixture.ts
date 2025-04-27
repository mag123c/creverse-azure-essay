import { Media } from '@src/app/submissions/domain/media';

export class MediaFixture {
  static createMedia() {
    return Media.of(
      'videoUrl',
      'audioUrl',
      {
        format: 'mp4',
        duration: 120,
        resolution: '1920x1080',
        originalFileName: 'test.mp4',
      },
      0,
    );
  }
}
