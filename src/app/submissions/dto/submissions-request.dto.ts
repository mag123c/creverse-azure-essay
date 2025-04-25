import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmissionsRequestDto {
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
export class SubmissionsRequestWithFile extends SubmissionsRequestDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: '영상 파일',
  })
  @IsOptional()
  videoFile?: Express.Multer.File;
}
