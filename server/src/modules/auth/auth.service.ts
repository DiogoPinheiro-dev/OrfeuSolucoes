import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthPayloadType } from './dto/auth-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(email: string, senha: string): Promise<AuthPayloadType> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordValid = await compare(senha, user.senhaHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.usersService.toUserType(user)
    };
  }

  attachAuthCookie(res: Response, token: string): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    const tokenTtlSeconds = this.configService.get<number>('JWT_EXPIRES_IN') ?? 8 * 60 * 60;

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: tokenTtlSeconds * 1000
    });
  }

  clearAuthCookie(res: Response): void {
    res.clearCookie('access_token');
  }
}