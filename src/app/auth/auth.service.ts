import { Injectable } from '@nestjs/common';
import { AuthRequestDto, JwtResponseDto } from './auth.dto';
import { StudentsService } from '../students/service/students.service';
import { JWTService } from './jwt/jwt.service';
import { StudentNotFoundException } from '@src/common/exceptions/auth.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JWTService,
    private readonly studentsService: StudentsService,
  ) {}
  async signin(req: AuthRequestDto): Promise<JwtResponseDto> {
    const student = await this.studentsService.findByName(req.name);
    if (!student) {
      throw new StudentNotFoundException();
    }
    const jwt = await this.jwtService.createToken(student);
    return JwtResponseDto.of(jwt);
  }

  async signup(req: AuthRequestDto): Promise<JwtResponseDto> {
    const student = await this.studentsService.create(req.name);
    const jwt = await this.jwtService.createToken(student);
    return JwtResponseDto.of(jwt);
  }
}
