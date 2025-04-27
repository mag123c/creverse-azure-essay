export class Evaluation {
  constructor(
    private readonly score: number,
    private readonly feedback: string,
    private readonly highlights: string[],
    private latency: number = 0,
  ) {}

  getScore(): number {
    return this.score;
  }
  getFeedback(): string {
    return this.feedback;
  }
  getHighlights(): string[] {
    return this.highlights;
  }
  getLatency(): number {
    return this.latency;
  }

  setLatency(latency: number) {
    this.latency = latency;
  }

  static of(score: number, feedback: string, highlights: string[], latency?: number): Evaluation {
    return new Evaluation(score, feedback, highlights, latency);
  }

  /**
   * 학생 에세이 평가 결과를 JSON 형식으로 변환합니다.
   */
  static fromJson(json: any): Evaluation {
    if (
      typeof json !== 'object' ||
      typeof json.score !== 'number' ||
      typeof json.feedback !== 'string' ||
      !Array.isArray(json.highlights)
    ) {
      throw new Error('평가 결과가 JSON 형식이 아닙니다.');
    }
    return new Evaluation(json.score, json.feedback, json.highlights);
  }
}
