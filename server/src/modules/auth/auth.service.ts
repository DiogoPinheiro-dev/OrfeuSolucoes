import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { EmpresasService } from '../empresas/empresas.service';
import { UserType } from '../users/dto/user.type';
import { UsersService } from '../users/users.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthSessionService } from './auth-session.service';
import { AuthPayloadType } from './dto/auth-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private readonly authCookie: AuthCookieService,
    private readonly authCredentials: AuthCredentialsService,
    private readonly authSession: AuthSessionService
  ) {}

  async login(loginOrEmail: string, senha: string, empresaId?: number): Promise<AuthPayloadType> {
    const user = await this.authCredentials.validateCredentials(loginOrEmail, senha);

    if (empresaId) {
      const vinculado = await this.empresasService.userBelongsToCompany(user.id, empresaId);

      if (!vinculado) {
        throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
      }
    }

    return this.authSession.buildAuthPayload(user.id, empresaId ?? null);
  }

  async findLoginCompanies(loginOrEmail: string, senha: string): Promise<EmpresaType[]> {
    const user = await this.authCredentials.validateCredentials(loginOrEmail, senha);

    return this.empresasService.findByUserId(user.id);
  }

  attachAuthCookie(res: Response, token: string): void {
    this.authCookie.attachAuthCookie(res, token);
  }

  clearAuthCookie(res: Response): void {
    this.authCookie.clearAuthCookie(res);
  }

  async changePassword(userId: string, novaSenha: string, empresaId?: number | null): Promise<AuthPayloadType> {
    const senha = novaSenha.trim();

    if (senha.toLowerCase() === 'admin123' || senha.toLowerCase() === 'admin') {
      throw new BadRequestException('Escolha uma senha diferente da senha temporaria.');
    }

    await this.usersService.updatePassword(userId, senha, false);

    return this.authSession.buildAuthPayload(userId, empresaId ?? null, false);
  }

  async switchCompany(userId: string, empresaId: number): Promise<AuthPayloadType> {
    const vinculado = await this.empresasService.userBelongsToCompany(userId, empresaId);

    if (!vinculado) {
      throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
    }

    return this.authSession.buildAuthPayload(userId, empresaId);
  }

  me(sessionUser: { sub: string; empresaId?: number | null; deveAlterarSenha?: boolean }): Promise<UserType> {
    return this.authSession.me(sessionUser);
  }
}