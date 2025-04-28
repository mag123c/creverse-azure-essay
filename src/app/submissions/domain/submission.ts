import { SubmissionDetailResponseDto } from '../dto/submissions-response.dto';
import type { Evaluation } from './evaluation';
import type { Media } from './media';
import type { SubmissionsEntity } from '../entities/submissions.entity';

export enum SubmissionStatus {
  PENDING = 'PENDING', // 대기중
  EVALUATING = 'EVALUATING', // 평가중
  SUCCESS = 'SUCCESS', // 평가완료
  FAILED = 'FAILED', // 평가실패
}

export class Submission {
  constructor(
    private readonly id: number | undefined,
    private readonly studentId: number,
    private readonly studentName: string,
    private readonly componentType: string,
    private readonly submitText: string,
    private status: SubmissionStatus = SubmissionStatus.PENDING,
    private evaluation?: Evaluation,
    private media?: Media,
    private highlightSubmitText: string = '',
    private createdDt?: Date,
    private updatedDt?: Date,
  ) {}

  getId(): number | undefined {
    return this.id;
  }
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
  getStatus(): SubmissionStatus | undefined {
    return this.status;
  }
  getHighlightSubmitText(): string {
    return this.highlightSubmitText;
  }
  setMedia(media: Media): void {
    this.media = media;
  }

  markAsEvaluating() {
    this.status = SubmissionStatus.EVALUATING;
  }

  applyEvaluation(evaluation: Evaluation): void {
    this.evaluation = evaluation;
    this.status = SubmissionStatus.SUCCESS;
    this.highlightSubmitText = this.generateHighlightSubmitText();
  }

  /** 평가 실패 시 호출 */
  applyEvaluationFailed(evaluation: Evaluation): void {
    this.evaluation = evaluation;
    this.status = SubmissionStatus.FAILED;
  }

  markAsFailed(): void {
    this.status = SubmissionStatus.FAILED;
  }

  toDto(): SubmissionDetailResponseDto {
    return SubmissionDetailResponseDto.of({
      id: this.id ?? 0,
      studentId: this.studentId,
      studentName: this.studentName,
      componentType: this.componentType,
      status: this.status,
      submitText: this.submitText,
      createdDt: this.createdDt ?? new Date(),
      updatedDt: this.updatedDt ?? new Date(),
      score: this.evaluation?.getScore(),
      feedback: this.evaluation?.getFeedback(),
      highlights: this.evaluation?.getHighlights(),
      highlightSubmitText: this.highlightSubmitText,
      mediaUrl: this.media?.toJson(),
    });
  }

  /** 새 제출 생성용: PK 없음 */
  static create(studentId: number, studentName: string, componentType: string, submitText: string): Submission {
    return new Submission(undefined, studentId, studentName, componentType, submitText);
  }

  static ofEntity(entity: SubmissionsEntity): Submission {
    const submission = new Submission(
      entity.id,
      entity.student.id,
      entity.student.name,
      entity.componentType,
      entity.submitText,
      entity.status,
    );
    submission.createdDt = entity.createdDt;
    submission.updatedDt = entity.updatedDt;
    return submission;
  }

  /**
   * submitText에 포함된 하이라이트 문장에 <b> 태그를 적용한 텍스트를 반환
   */
  private generateHighlightSubmitText(): string {
    if (!this.evaluation) return this.submitText;

    const highlights = this.evaluation.getHighlights().filter((h): h is string => typeof h === 'string');

    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
    let result = this.submitText;

    for (const highlight of sortedHighlights) {
      const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      result = result.replace(regex, `<b>${highlight}</b>`);
    }

    return result;
  }
}
