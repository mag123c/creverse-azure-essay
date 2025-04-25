import { ApiProperty } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthRequestDto {
  /**
   * 회원 이름
   * @example "홍길동"
   */
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class JwtResponse {
  /**
   * JWT 토큰
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}

export class JwtResponseDto extends ApiSuccessResponse<JwtResponse> {
  @ApiProperty({ type: JwtResponse })
  data: JwtResponse;

  constructor(data: JwtResponse) {
    super();
    this.data = data;
  }

  static of(data: JwtResponse): JwtResponseDto {
    return new JwtResponseDto(data);
  }
}
