import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { normalizeAndValidatePassword } from '../../common/security/password.policy';
import { Response } from 'express';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { EmpresasService } from '../empresas/empresas.service';
import { UserType } from '../users/dto/user.type';
import { UsersService } from '../users/users.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthSessionResult, AuthSessionService } from './auth-session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private readonly authCookie: AuthCookieService,
    private readonly authCredentials: AuthCredentialsService,
    private readonly authSession: AuthSessionService,
    private readonly authRateLimit: AuthRateLimitService
  ) {}

  async login(
    loginOrEmail: string,
    senha: string,
    empresaId?: number,
    clientAddress?: string | null
  ): Promise<AuthSessionResult> {
    this.authRateLimit.assertAllowed(loginOrEmail, clientAddress);

    try {
      const user = await this.authCredentials.validateCredentials(loginOrEmail, senha);

      if (empresaId !== undefined) {
        const vinculado = await this.empresasService.userBelongsToCompany(user.id, empresaId);

        if (!vinculado) {
          throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
        }
      }

      const result = await this.authSession.buildAuthPayload(user.id, empresaId ?? null);
      this.authRateLimit.recordSuccess(loginOrEmail, clientAddress);
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.authRateLimit.recordFailure(loginOrEmail, clientAddress);
      }

      throw error;
    }
  }

  async findLoginCompanies(
    loginOrEmail: string,
    senha: string,
    clientAddress?: string | null
  ): Promise<EmpresaType[]> {
    this.authRateLimit.assertAllowed(loginOrEmail, clientAddress);

    try {
      const user = await this.authCredentials.validateCredentials(loginOrEmail, senha);
      const empresas = await this.empresasService.findByUserId(user.id);
      this.authRateLimit.recordSuccess(loginOrEmail, clientAddress);
      return empresas;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.authRateLimit.recordFailure(loginOrEmail, clientAddress);
      }

      throw error;
    }
  }

  attachAuthCookie(res: Response, token: string): void {
    this.authCookie.attachAuthCookie(res, token);
  }

  clearAuthCookie(res: Response): void {
    this.authCookie.clearAuthCookie(res);
  }

  async logout(userId: string, res: Response): Promise<void> {
    try {
      await this.usersService.revokeSessions(userId);
    } finally {
      this.clearAuthCookie(res);
    }
  }

  async changePassword(
    userId: string,
    senhaAtual: string | undefined,
    novaSenha: string,
    empresaId?: number | null
  ): Promise<AuthSessionResult> {
    const user = await this.usersService.findById(userId);
    const senha = normalizeAndValidatePassword(novaSenha);

    if (!user.deveAlterarSenha) {
      if (!senhaAtual) {
        throw new BadRequestException('Informe a senha atual para alterar a senha.');
      }

      await this.authCredentials.assertCurrentPassword(userId, senhaAtual);
    }

    if (await this.authCredentials.isCurrentPassword(userId, senha)) {
      throw new BadRequestException('A nova senha deve ser diferente da senha atual.');
    }

    await this.usersService.updatePassword(userId, senha, false);

    return this.authSession.buildAuthPayload(userId, empresaId ?? null);
  }

  async switchCompany(userId: string, empresaId: number): Promise<AuthSessionResult> {
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
