import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';
import { PaginationMeta } from '@src/common/pagination/pagination.interface';
import { PaginationMetaDto } from '@src/common/pagination/meta.dto';
import { SubmissionStatus } from '../domain/submission';
import { SubmissionsEntity } from '../entities/submissions.entity';

class MediaResponse {
  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  readonly video?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  readonly audio?: string;

  constructor(video?: string, audio?: string) {
    this.video = video;
    this.audio = audio;
  }
}

class SubmissionDetailItem {
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

  @ApiProperty({ description: '업데이트 일자', example: '2025-01-01T12:00:00Z' })
  readonly updatedDt!: Date;

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

  @ApiPropertyOptional({ description: '영상을 보냈을 경우 영상에 대한 영상, 음성 분리 경로 정보', type: MediaResponse })
  readonly mediaUrl?: MediaResponse;

  constructor(data: {
    studentId: number;
    studentName: string;
    componentType: string;
    status: SubmissionStatus;
    submitText: string;
    createdDt: Date;
    updatedDt: Date;
    score?: number;
    feedback?: string;
    highlights?: string[];
    highlightSubmitText?: string;
    mediaUrl?: MediaResponse;
  }) {
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.componentType = data.componentType;
    this.status = data.status;
    this.submitText = data.submitText;
    this.createdDt = data.createdDt;
    this.updatedDt = data.updatedDt;
    this.score = data.score;
    this.feedback = data.feedback;
    this.highlights = data.highlights;
    this.highlightSubmitText = data.highlightSubmitText;
    this.mediaUrl = data.mediaUrl;
  }
}

export class SubmissionDetailResponseDto extends ApiSuccessResponse<SubmissionDetailItem> {
  @ApiProperty({ type: SubmissionDetailItem })
  data: SubmissionDetailItem;

  constructor(data: SubmissionDetailItem) {
    super();
    this.data = data;
  }

  static of(data: SubmissionDetailItem): SubmissionDetailResponseDto {
    return new SubmissionDetailResponseDto(data);
  }
}

class SubmissionListItem {
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

  @ApiProperty({ description: '업데이트 일자', example: '2025-01-01T12:00:00Z' })
  readonly updatedDt!: Date;

  @ApiPropertyOptional({ description: '점수(0 ~ 10)', example: 8 })
  readonly score?: number;

  constructor(data: {
    studentId: number;
    studentName: string;
    componentType: string;
    status: SubmissionStatus;
    createdDt: Date;
    updatedDt: Date;
    score?: number;
  }) {
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.componentType = data.componentType;
    this.status = data.status;
    this.createdDt = data.createdDt;
    this.updatedDt = data.updatedDt;
    this.score = data.score;
  }
}

/**
 * @GET /v1/submissions 응답 DTO
 */
export class GetSubmissionsResponseDto extends ApiSuccessResponse<SubmissionListItem> {
  @ApiProperty({ type: () => SubmissionListItem, isArray: true })
  data: SubmissionListItem[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMeta;

  constructor(submissions: SubmissionListItem[], meta: PaginationMeta) {
    super();
    this.data = submissions;
    this.meta = meta;
  }

  static of(submissionsEntity: SubmissionsEntity[], meta: PaginationMeta): GetSubmissionsResponseDto {
    const submissions = submissionsEntity.map(
      (submission) =>
        new SubmissionListItem({
          studentId: submission.student.id,
          studentName: submission.student.name,
          componentType: submission.componentType,
          status: submission.status,
          createdDt: submission.createdDt,
          updatedDt: submission.updatedDt,
          score: submission.score,
        }),
    );
    return new GetSubmissionsResponseDto(submissions, meta);
  }
}
