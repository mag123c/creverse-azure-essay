import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export abstract class ApiSuccessResponse<T> {
  @ApiProperty({ default: 'ok' })
  result!: 'ok';
  @ApiProperty({ default: null, nullable: true, type: 'string' })
  message!: null;
  @ApiPropertyOptional()
  apiLatency!: number;
  @ApiPropertyOptional()
  data?: T | T[];

  constructor() {
    this.result = 'ok';
    this.message = null;
  }
}

export class ErrorResponseDto {
  @ApiProperty({ example: 'failed', description: '요청 실패 결과' })
  result!: 'failed';

  @ApiProperty({ description: '에러 메시지', example: '에러가 발생했습니다.' })
  message!: string;
}
