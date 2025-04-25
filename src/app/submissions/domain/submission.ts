import { SubmissionsResponseDto } from '../dto/submissions-response.dto';
import type { Evaluation } from './evaluation';

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
    private readonly submitText: string,
    private status: SubmissionStatus = SubmissionStatus.PENDING,
    private evaluation?: Evaluation,
  ) {}

  getStudentId(): number {
    return this.studentId;
  }
  getStudentName(): string {
    return this.studentName;
  }
  getSubmitText(): string {
    return this.submitText;
  }

  applyEvaluation(evaluation: Evaluation): void {
    this.evaluation = evaluation;
    this.status = SubmissionStatus.SUCCESS;
  }

  markAsEvaluating(): void {
    this.status = SubmissionStatus.EVALUATING;
  }

  markAsFailed(): void {
    this.status = SubmissionStatus.FAILED;
  }

  toDto(): SubmissionsResponseDto {
    return SubmissionsResponseDto.of({
      studentId: this.studentId,
      studentName: this.studentName,
      submitText: this.submitText,
      score: this.evaluation?.score ?? 0,
      feedback: this.evaluation?.feedback ?? '',
      highlights: this.evaluation?.highlights ?? [],
      highlightSubmitText: this.generateHighlightSubmitText(),
    });
  }

  static of(studentId: number, studentName: string, submitText: string): Submission {
    return new Submission(studentId, studentName, submitText);
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
