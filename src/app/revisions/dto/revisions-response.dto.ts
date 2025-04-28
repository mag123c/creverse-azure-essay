import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { MediaItem, type SubmissionList } from '@src/app/submissions/dto/submissions-response.dto';
import { PaginationMetaDto } from '@src/common/pagination/meta.dto';
import { PaginationMeta } from '@src/common/pagination/pagination.interface';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';
import { RevisionsEntity } from '../entities/revisions.entity';

export interface RevisionList extends Omit<SubmissionList, 'updatedDt'> {
  submissionId: number;
}

export interface RevisionDetail extends RevisionList {
  submitText: string;
  feedback?: string;
  highlights?: string[];
  highlightSubmitText?: string;
  mediaUrl?: MediaItem;
}

class RevisionListItem implements RevisionList {
  @ApiProperty({ description: '재평가 고유 식별자 (PK)', example: 1 })
  readonly id!: number;

  @ApiProperty({ description: '등록된 평가 요청의 고유 식별자 (PK)', example: 1 })
  readonly submissionId!: number;

  @ApiProperty({ description: '학생의 고유 식별자 (PK)', example: 1 })
  readonly studentId!: number;

  @ApiProperty({ description: '학생 이름', example: '홍길동' })
  readonly studentName!: string;

  @ApiProperty({ description: '제출한 컴포넌트 타입', example: 'Essay' })
  readonly componentType!: string;

  @ApiProperty({ description: '제출 상태', enum: SubmissionStatus, example: 'EVALUATING' })
  readonly status!: SubmissionStatus;

  @ApiProperty({ description: '제출 일자', example: '2025-01-01T12:00:00Z' })
  readonly createdDt!: Date;

  @ApiPropertyOptional({ description: '점수(0 ~ 10)', example: 8 })
  readonly score?: number;

  constructor(data: {
    id: number;
    submissionId: number;
    studentId: number;
    studentName: string;
    componentType: string;
    status: SubmissionStatus;
    createdDt: Date;
    score?: number;
  }) {
    this.id = data.id;
    this.submissionId = data.submissionId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.componentType = data.componentType;
    this.status = data.status;
    this.createdDt = data.createdDt;
    this.score = data.score;
  }
}

/**
 * @GET /v1/revisions 응답 DTO
 */
export class GetRevisionsResponseDto extends ApiSuccessResponse<RevisionListItem> {
  @ApiProperty({ type: () => RevisionListItem, isArray: true })
  data: RevisionListItem[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMeta;

  constructor(revisions: RevisionListItem[], meta: PaginationMeta) {
    super();
    this.data = revisions;
    this.meta = meta;
  }

  static of(revisionsEntity: RevisionsEntity[], meta: PaginationMeta): GetRevisionsResponseDto {
    const revisions = revisionsEntity.map(
      (revision) =>
        new RevisionListItem({
          id: revision.id,
          submissionId: revision.submission.id,
          studentId: revision.submission.student.id,
          studentName: revision.submission.student.name,
          componentType: revision.componentType,
          status: revision.status,
          createdDt: revision.createdDt,
          score: revision.score,
        }),
    );
    return new GetRevisionsResponseDto(revisions, meta);
  }
}

export class RevisionDetailItem implements RevisionDetail {
  @ApiProperty({ description: '재평가 고유 식별자 (PK)', example: 1 })
  readonly id!: number;

  @ApiProperty({ description: '등록된 평가 요청의 고유 식별자 (PK)', example: 1 })
  readonly submissionId!: number;

  @ApiProperty({ description: '학생의 고유 식별자 (PK)', example: 1 })
  readonly studentId!: number;

  @ApiProperty({ description: '학생 이름', example: '홍길동' })
  readonly studentName!: string;

  @ApiProperty({ description: '제출한 컴포넌트 타입', example: 'Essay' })
  readonly componentType!: string;

  @ApiProperty({ description: '제출 상태', enum: SubmissionStatus, example: 'EVALUATING' })
  readonly status!: SubmissionStatus;

  @ApiPropertyOptional({
    description: '평가 시 보냈던 텍스트',
    example: 'Hello, this is a test video. I hope you enjoy it.',
  })
  readonly submitText!: string;

  @ApiProperty({ description: '제출 일자', example: '2025-01-01T12:00:00Z' })
  readonly createdDt!: Date;

  @ApiPropertyOptional({ description: '점수(0 ~ 10)', example: 8 })
  readonly score?: number;

  @ApiPropertyOptional({
    description: 'AI 피드백',
    example: 'Great organization, minor grammar issues. Consider revising the conclusion.',
  })
  readonly feedback?: string;

  @ApiPropertyOptional({
    description: 'AI 피드백 하이라이트',
    example: [
      'Excellent introduction and thesis statement.',
      'Strong supporting arguments with relevant examples.',
      'Good use of transition words.',
    ],
  })
  readonly highlights?: string[];

  @ApiPropertyOptional({
    description: '평가시 보냈던 텍스트에 대한 AI 피드백 하이라이트 강조 텍스트',
    example: 'Hello, this is a test video. <b> I hope you enjoy it.</b>',
  })
  readonly highlightSubmitText?: string;

  @ApiPropertyOptional({ description: '영상을 보냈을 경우 영상에 대한 영상, 음성 분리 경로 정보', type: MediaItem })
  readonly mediaUrl?: MediaItem;

  constructor(data: {
    id: number;
    submissionId: number;
    studentId: number;
    studentName: string;
    componentType: string;
    status: SubmissionStatus;
    submitText: string;
    createdDt: Date;
    score?: number;
    feedback?: string;
    highlights?: string[];
    highlightSubmitText?: string;
    mediaUrl?: MediaItem;
  }) {
    this.id = data.id;
    this.submissionId = data.id;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.componentType = data.componentType;
    this.status = data.status;
    this.submitText = data.submitText;
    this.createdDt = data.createdDt;
    this.score = data.score;
    this.feedback = data.feedback;
    this.highlights = data.highlights;
    this.highlightSubmitText = data.highlightSubmitText;
    this.mediaUrl = data.mediaUrl;
  }
}

export class RevisionDetailResponseDto extends ApiSuccessResponse<RevisionDetailItem> {
  @ApiProperty({ type: RevisionDetailItem })
  data: RevisionDetailItem;

  constructor(data: RevisionDetailItem) {
    super();
    this.data = data;
  }

  static of(data: RevisionDetailItem): RevisionDetailResponseDto {
    return new RevisionDetailResponseDto(data);
  }
}
