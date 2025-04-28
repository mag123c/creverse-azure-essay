import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthRequestDto, JwtResponseDto } from './auth.dto';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '로그인(테스트용 - 가입한 이름으로 토큰 반환)',
  })
  @Post('signin')
  async signin(@Body() req: AuthRequestDto): Promise<JwtResponseDto> {
    return this.authService.signin(req);
  }

  @ApiOperation({
    summary: '회원가입(테스트용 - 액세스토큰 반환)',
    description: '임의 회원가입 API입니다. 이름에 대한 중복 가입 가능합니다.',
  })
  @Post('signup')
  async signup(@Body() req: AuthRequestDto): Promise<JwtResponseDto> {
    return this.authService.signup(req);
  }
}
