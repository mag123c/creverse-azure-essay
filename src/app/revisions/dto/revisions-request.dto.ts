import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * @API POST /v1/revisions의 요청 본문
 */
export class RevisionRequestDto {
  @IsNumber()
  @IsNotEmpty()
  readonly submissionId!: number;
}
