import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export abstract class ApiSuccessResponse<T> {
  @ApiProperty({ default: 'ok' })
  result!: 'ok';
  @ApiProperty({ default: null, nullable: true, type: 'string' })
  message!: null;
  @ApiPropertyOptional()
  apiLatency!: number;
  @ApiPropertyOptional()
  data?: T;

  constructor() {
    this.result = 'ok';
    this.message = null;
  }
}
