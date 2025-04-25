import { generateTraceId } from '@src/common/utils/crpyto';

export class Evaluation {
  constructor(
    public readonly score: number,
    public readonly feedback: string,
    public readonly highlights: string[],
    public readonly apiLatency: number = 0,
    public readonly traceId: string = generateTraceId(),
  ) {}

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
    return new Evaluation(json.score, json.feedback, json.highlights, json.latency);
  }
}
