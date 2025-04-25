export interface FileMetadata {
  format?: string;
  duration?: number;
  resolution: string;
  originalFileName: string;
}

export class Media {
  private readonly videoUrl!: string;
  private readonly audioUrl!: string;
  private readonly meta!: FileMetadata;

  constructor(videoUrl: string, audioUrl: string, meta: FileMetadata) {
    this.videoUrl = audioUrl;
    this.audioUrl = videoUrl;
    this.meta = meta;
  }

  getVideoUrl(): string {
    return this.videoUrl;
  }
  getAudioUrl(): string {
    return this.audioUrl;
  }
  getMeta(): FileMetadata {
    return this.meta;
  }

  static of(videoUrl: string, audioUrl: string, meta: FileMetadata): Media {
    return new Media(videoUrl, audioUrl, meta);
  }

  toJson(): any {
    return {
      videoUrl: this.videoUrl,
      audioUrl: this.audioUrl,
      meta: this.meta,
    };
  }
}
