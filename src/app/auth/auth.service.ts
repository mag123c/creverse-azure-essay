import { Injectable } from '@nestjs/common';
import { AuthRequestDto, JwtResponseDto } from './auth.dto';
import { StudentsService } from '../students/service/students.service';
import { JWTService } from './jwt/jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JWTService,
    private readonly studentsService: StudentsService,
  ) {}
  async signup(req: AuthRequestDto): Promise<JwtResponseDto> {
    const student = await this.studentsService.create(req.name);
    const jwt = await this.jwtService.createToken(student);
    return JwtResponseDto.of(jwt);
  }
}
