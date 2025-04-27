import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';

class MediaResponse {
  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  private video?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  private audio?: string;
}

class SubmissionsResponse {
  @ApiProperty({ description: '학생의 고유 식별자 (PK)', example: 1 })
  readonly studentId!: number;

  @ApiProperty({ description: '학생 이름', example: '홍길동' })
  readonly studentName!: string;

  @ApiPropertyOptional({
    description: '평가 시 보냈던 텍스트',
    example: 'Hello, this is a test video. I hope you enjoy it.',
  })
  readonly submitText!: string;

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
}

export class SubmissionsResponseDto extends ApiSuccessResponse<SubmissionsResponse> {
  @ApiProperty({ type: SubmissionsResponse })
  data: SubmissionsResponse;

  constructor(data: SubmissionsResponse) {
    super();
    this.data = data;
  }

  static of(data: SubmissionsResponse): SubmissionsResponseDto {
    return new SubmissionsResponseDto(data);
  }
}
