import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Response } from 'express';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { EmpresasService } from '../empresas/empresas.service';
import { SolucoesService } from '../solucoes/solucoes.service';
import { UsersService } from '../users/users.service';
import { UserType } from '../users/dto/user.type';
import { AuthPayloadType } from './dto/auth-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private readonly solucoesService: SolucoesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(loginOrEmail: string, senha: string, empresaId?: number): Promise<AuthPayloadType> {
    const user = await this.validateCredentials(loginOrEmail, senha);

    if (empresaId) {
      const vinculado = await this.empresasService.userBelongsToCompany(user.id, empresaId);

      if (!vinculado) {
        throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
      }
    }

    return this.buildAuthPayload(user.id, empresaId ?? null);
  }

  async findLoginCompanies(loginOrEmail: string, senha: string): Promise<EmpresaType[]> {
    const user = await this.validateCredentials(loginOrEmail, senha);

    return this.empresasService.findByUserId(user.id);
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

  async changePassword(userId: string, novaSenha: string, empresaId?: number | null): Promise<AuthPayloadType> {
    const senha = novaSenha.trim();

    if (senha.toLowerCase() === 'admin123' || senha.toLowerCase() === 'admin') {
      throw new BadRequestException('Escolha uma senha diferente da senha temporaria.');
    }

    await this.usersService.updatePassword(userId, senha, false);

    return this.buildAuthPayload(userId, empresaId ?? null, false);
  }

  async switchCompany(userId: string, empresaId: number): Promise<AuthPayloadType> {
    const vinculado = await this.empresasService.userBelongsToCompany(userId, empresaId);

    if (!vinculado) {
      throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
    }

    return this.buildAuthPayload(userId, empresaId);
  }

  async me(sessionUser: { sub: string; empresaId?: number | null; deveAlterarSenha?: boolean }): Promise<UserType> {
    const userType = await this.usersService.findTypeById(sessionUser.sub);
    const empresa = this.resolveActiveCompany(userType, sessionUser.empresaId ?? null);
    const availableSolutions = await this.solucoesService.resolveAvailableSolutionSlugs(userType, empresa?.id ?? null);

    return {
      ...userType,
      empresa,
      availableSolutions,
      deveAlterarSenha: sessionUser.deveAlterarSenha ?? userType.deveAlterarSenha
    };
  }

  private async validateCredentials(loginOrEmail: string, senha: string) {
    const user = await this.usersService.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordValid = await compare(senha, user.senhaHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return user;
  }

  private async buildAuthPayload(
    userId: string,
    empresaId?: number | null,
    deveAlterarSenha?: boolean
  ): Promise<AuthPayloadType> {
    const userType = await this.usersService.findTypeById(userId);
    const empresa = await this.resolveCompanyForUser(userId, empresaId ?? null);
    const availableSolutions = await this.solucoesService.resolveAvailableSolutionSlugs(userType, empresa?.id ?? null);
    const payload = {
      sub: userType.id,
      email: userType.email,
      login: userType.login ?? null,
      nome: userType.nome,
      grupo: userType.grupo ?? null,
      podeVisualizar: userType.podeVisualizar,
      podeIncluir: userType.podeIncluir,
      podeAlterar: userType.podeAlterar,
      podeExcluir: userType.podeExcluir,
      deveAlterarSenha: deveAlterarSenha ?? userType.deveAlterarSenha,
      empresaId: empresa?.id ?? null,
      empresaNome: empresa?.nome ?? null,
      availableSolutions
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        ...userType,
        empresa,
        availableSolutions,
        deveAlterarSenha: deveAlterarSenha ?? userType.deveAlterarSenha
      }
    };
  }

  private async resolveCompanyForUser(userId: string, empresaId?: number | null): Promise<EmpresaType | null> {
    if (!empresaId) {
      return null;
    }

    const empresa = await this.empresasService.findById(empresaId);
    const vinculado = await this.empresasService.userBelongsToCompany(userId, empresaId);

    if (!vinculado) {
      throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
    }

    return this.empresasService.toEmpresaType(empresa);
  }

  private resolveActiveCompany(user: UserType, empresaId?: number | null): EmpresaType | null {
    if (!empresaId) {
      return null;
    }

    return user.empresas.find((empresa) => empresa.id === empresaId) ?? null;
  }

}
