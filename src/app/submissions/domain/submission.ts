import { generateTraceId } from '@src/common/utils/crpyto';
import { SubmissionsResponseDto } from '../dto/submissions-response.dto';
import type { SubmissionsEntity } from '../entities/submissions.entity';
import type { Evaluation } from './evaluation';
import type { Media } from './media';

export enum SubmissionStatus {
  PENDING = 'PENDING',
  EVALUATING = 'EVALUATING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class Submission {
  constructor(
    private readonly studentId: number,
    private readonly studentName: string,
    private readonly componentType: string,
    private readonly submitText: string,
    private status: SubmissionStatus = SubmissionStatus.PENDING,
    private evaluation?: Evaluation,
    private media?: Media,
    private apiLatency: number = 0,
    private highlightSubmitText: string = '',
    private errorMessage?: string,
    private readonly traceId: string = generateTraceId(),
  ) {}

  getStudentId(): number {
    return this.studentId;
  }
  getStudentName(): string {
    return this.studentName;
  }
  getComponentType(): string {
    return this.componentType;
  }
  getSubmitText(): string {
    return this.submitText;
  }
  getEvaluation(): Evaluation | undefined {
    return this.evaluation;
  }
  getMedia(): Media | undefined {
    return this.media;
  }
  getStatus(): SubmissionStatus {
    return this.status;
  }
  getApiLatency(): number {
    return this.apiLatency;
  }
  getHighlightSubmitText(): string {
    return this.highlightSubmitText;
  }
  getTraceId(): string {
    return this.traceId;
  }
  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }
  setErrorMessage(errorMessage: string): void {
    this.errorMessage = errorMessage;
  }

  applyEvaluation(evaluation: Evaluation): void {
    this.evaluation = evaluation;
    this.status = SubmissionStatus.SUCCESS;
    this.highlightSubmitText = this.generateHighlightSubmitText();
    this.apiLatency = evaluation.apiLatency;
  }

  markAsEvaluating(): void {
    this.status = SubmissionStatus.EVALUATING;
  }

  markAsFailed(errorMessage: string): void {
    this.status = SubmissionStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  toDto(): SubmissionsResponseDto {
    return SubmissionsResponseDto.of({
      studentId: this.studentId,
      studentName: this.studentName,
      submitText: this.submitText,
      score: this.evaluation?.score ?? 0,
      feedback: this.evaluation?.feedback ?? '',
      highlights: this.evaluation?.highlights ?? [],
      highlightSubmitText: this.highlightSubmitText,
    });
  }

  static of(studentId: number, studentName: string, componentType: string, submitText: string): Submission {
    return new Submission(studentId, studentName, componentType, submitText);
  }

  static ofEntity(entity: SubmissionsEntity): Submission {
    const submission = new Submission(
      entity.student.id,
      entity.student.name,
      entity.componentType,
      entity.submitText,
      entity.status,
    );
    return submission;
  }

  /**
   * submitText에 포함된 하이라이트 문장에 <b> 태그를 적용한 텍스트를 반환
   */
  private generateHighlightSubmitText(): string {
    if (!this.evaluation) return this.submitText;

    const sortedHighlights = [...this.evaluation.highlights].sort((a, b) => b.length - a.length);
    let result = this.submitText;

    for (const highlight of sortedHighlights) {
      const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      result = result.replace(regex, `<b>${highlight}</b>`);
    }

    return result;
  }
}
