import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Response } from 'express';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { EmpresaRecord, EmpresasService } from '../empresas/empresas.service';
import { UsersService } from '../users/users.service';
import { AuthPayloadType } from './dto/auth-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(loginOrEmail: string, senha: string, empresaId?: number): Promise<AuthPayloadType> {
    const user = await this.validateCredentials(loginOrEmail, senha);
    let empresa: EmpresaRecord | null = null;

    if (empresaId) {
      empresa = await this.empresasService.findById(empresaId);
      const vinculado = await this.empresasService.userBelongsToCompany(user.id, empresaId);

      if (!vinculado) {
        throw new UnauthorizedException('Usuario nao vinculado a empresa selecionada.');
      }
    }

    const userType = this.usersService.toUserType(user);
    const availableSolutions = this.resolveAvailableSolutions(userType, empresa);
    const empresaType: EmpresaType | null = empresa ? this.empresasService.toEmpresaType(empresa) : null;

    const payload = {
      sub: user.id,
      email: user.email,
      login: user.login ?? null,
      nome: user.nome,
      grupo: userType.grupo ?? null,
      podeVisualizar: userType.podeVisualizar,
      podeIncluir: userType.podeIncluir,
      podeAlterar: userType.podeAlterar,
      podeExcluir: userType.podeExcluir,
      deveAlterarSenha: userType.deveAlterarSenha,
      empresaId: empresa?.id ?? null,
      empresaNome: empresa?.nome ?? null,
      availableSolutions
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        ...userType,
        empresa: empresaType,
        availableSolutions
      }
    };
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

    const userType = await this.usersService.findTypeById(userId);
    const empresa = empresaId ? await this.empresasService.findById(empresaId) : null;
    const empresaType: EmpresaType | null = empresa ? this.empresasService.toEmpresaType(empresa) : null;
    const availableSolutions = this.resolveAvailableSolutions(userType, empresa);
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
      deveAlterarSenha: false,
      empresaId: empresa?.id ?? null,
      empresaNome: empresa?.nome ?? null,
      availableSolutions
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        ...userType,
        empresa: empresaType,
        deveAlterarSenha: false,
        availableSolutions
      }
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

  private resolveAvailableSolutions(
    user?: {
      login?: string | null;
      grupo?: {
        acessoEcommerce?: boolean;
        acessoProjetos?: boolean;
        acessoHoras?: boolean;
        acessoConfigurador?: boolean;
      } | null;
    } | null,
    empresa?: EmpresaRecord | null
  ): string[] {
    const groupSolutions = this.resolveGroupSolutions(user);
    const companySolutions = this.resolveCompanySolutions(empresa);

    if (!empresa) {
      return groupSolutions;
    }

    return groupSolutions.filter((solution) =>
      solution === 'configurador' ? this.isSystemAdmin(user) : companySolutions.includes(solution)
    );
  }

  private resolveCompanySolutions(empresa?: EmpresaRecord | null): string[] {
    if (!empresa) {
      return [];
    }

    return [
      empresa.acessoEcommerce ? 'ecommerce' : null,
      empresa.acessoProjetos ? 'projetos' : null,
      empresa.acessoHoras ? 'horas' : null
    ].filter((solution): solution is string => !!solution);
  }

  private resolveGroupSolutions(
    user?: {
      login?: string | null;
      grupo?: {
        acessoEcommerce?: boolean;
        acessoProjetos?: boolean;
        acessoHoras?: boolean;
        acessoConfigurador?: boolean;
      } | null;
    } | null
  ): string[] {
    const grupo = user?.grupo;
    const canAccessConfigurador = this.isSystemAdmin(user);

    if (this.hasFullGroupAccess(grupo)) {
      return [
        'ecommerce',
        'projetos',
        'horas',
        canAccessConfigurador ? 'configurador' : null
      ].filter((solution): solution is string => !!solution);
    }

    if (!grupo) {
      return ['ecommerce'];
    }

    return [
      grupo.acessoEcommerce ? 'ecommerce' : null,
      grupo.acessoProjetos ? 'projetos' : null,
      grupo.acessoHoras ? 'horas' : null,
      grupo.acessoConfigurador && canAccessConfigurador ? 'configurador' : null
    ].filter((solution): solution is string => !!solution);
  }

  private isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  private hasFullGroupAccess(
    grupo?: {
      acessoEcommerce?: boolean;
      acessoProjetos?: boolean;
      acessoHoras?: boolean;
      acessoConfigurador?: boolean;
    } | null
  ): boolean {
    return !!(
      grupo?.acessoEcommerce &&
      grupo.acessoProjetos &&
      grupo.acessoHoras &&
      grupo.acessoConfigurador
    );
  }
}
