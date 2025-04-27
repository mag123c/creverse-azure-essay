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
  private readonly latency: number = 0;

  constructor(videoUrl: string, audioUrl: string, meta: FileMetadata, latency: number) {
    this.videoUrl = audioUrl;
    this.audioUrl = videoUrl;
    this.meta = meta;
    this.latency = latency;
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
  getLatency(): number {
    return this.latency;
  }

  static of(videoUrl: string, audioUrl: string, meta: FileMetadata, latency: number): Media {
    return new Media(videoUrl, audioUrl, meta, latency);
  }

  toJson(): any {
    return {
      videoUrl: this.videoUrl,
      audioUrl: this.audioUrl,
      meta: this.meta,
    };
  }
}
