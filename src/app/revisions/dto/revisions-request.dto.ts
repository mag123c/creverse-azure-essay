import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@src/app/submissions/domain/submission';
import { PaginationRequest } from '@src/common/pagination/pagination.interface';
import { IsValidSortField } from '@src/common/validator/sort-validator';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * @GET /v1/revisions 요청 DTO
 */
export class GetRevisionsRequestDto implements PaginationRequest {
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
   * 제출했던 컴포넌트 타입 (1=1)
   * @example "Essay Writing"
   */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  componentType?: string;
}

/**
 * @API POST /v1/revisions의 요청 본문
 */
export class RevisionRequestDto {
  @IsNumber()
  @IsNotEmpty()
  readonly submissionId!: number;
}
