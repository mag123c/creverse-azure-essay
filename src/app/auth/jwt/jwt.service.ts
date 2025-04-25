import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtResponse } from '../auth.dto';

@Injectable()
export class JWTService {
  constructor(private readonly jwtService: JwtService) {}

  async createToken({ id, name }: { id: number; name: string }): Promise<JwtResponse> {
    const jwtEncode = {
      id,
      name,
    };

    return {
      accessToken: await this.signAccessToken({ ...jwtEncode }),
    };
  }

  private async signAccessToken(payload: object) {
    return await this.jwtService.signAsync(payload);
  }
}
