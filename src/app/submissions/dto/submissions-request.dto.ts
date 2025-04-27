import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SubmissionStatus } from '../domain/submission';
import { IsValidSortField } from '@src/common/validator/sort-validator';
import { PaginationRequest } from '@src/common/pagination/pagination.interface';

/**
 * POST /v1/submissions 요청 DTO
 */
export class CreateSubmissionsRequestDto {
  /**
   * 학생 당 평가할 수 있는 고유 타입, 학생 당 한 번의 타입 별 평가 요청만 허용
   * @example "Essay Writing"
   */
  @IsString()
  @IsNotEmpty()
  readonly componentType!: string;

  /**
   * 평가 받을 텍스트
   * @example "Hello, this is a test video. I hope you enjoy it."
   */
  @IsString()
  @IsNotEmpty()
  readonly submitText!: string;
}

/**
 * 스웨거 문서화용 DTO
 */
export class CreateSubmissionsRequestWithFile extends CreateSubmissionsRequestDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: '영상 파일',
  })
  @IsOptional()
  videoFile?: Express.Multer.File;
}

/**
 * @GET /v1/submissions 요청 DTO
 */
export class GetSubmissionsRequestDto implements PaginationRequest {
  /**
   * 페이지 번호
   * @example 1
   */
  @ApiPropertyOptional({ default: 1, minimum: 1, description: '페이지 번호(디폴트 1)' })
  @Min(1)
  @IsNumber()
  @IsOptional()
  page: number = 1;

  /**
   * 페이지 크기
   * @example 20
   */
  @ApiPropertyOptional({ default: 20, minimum: 1, description: '페이지 크기(디폴트 20)' })
  @Min(1)
  @IsNumber()
  @IsOptional()
  size: number = 20;

  /**
   * 정렬 기준 (default: createdDt,DESC)
   * @example "createdDt,DESC"
   */
  @ApiPropertyOptional({ default: 'createdDt,DESC', example: 'createdDt,DESC' })
  @IsValidSortField()
  @IsString()
  @IsOptional()
  sort?: string;

  /**
   * 상태 필터
   * @example "PENDING"
   */
  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsIn(Object.values(SubmissionStatus))
  @IsOptional()
  status?: SubmissionStatus;

  /**
   * 제출했던 컴포넌트 타입
   * @example "Essay Writing"
   */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  componentType?: string;
}
