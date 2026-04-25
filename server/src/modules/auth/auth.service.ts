import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Response } from 'express';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { EmpresaRecord, EmpresasService } from '../empresas/empresas.service';
import { UserRole } from '../users/dto/user-role.enum';
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

  async login(email: string, senha: string, empresaId?: number): Promise<AuthPayloadType> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordValid = await compare(senha, user.senhaHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    let empresa: EmpresaRecord | null = null;

    if (empresaId) {
      empresa = await this.empresasService.findById(empresaId);
      const vinculado = await this.empresasService.userBelongsToCompany(user.id, empresaId);

      if (!vinculado) {
        throw new UnauthorizedException('Usuário não vinculado à empresa selecionada.');
      }
    }

    const tipo = this.normalizeRole(user.tipo);
    const availableSolutions = this.resolveAvailableSolutions(tipo, empresa);
    const empresaType: EmpresaType | null = empresa ? this.empresasService.toEmpresaType(empresa) : null;

    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      tipo,
      empresaId: empresa?.id ?? null,
      empresaNome: empresa?.nome ?? null,
      availableSolutions
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        ...this.usersService.toUserType(user),
        tipo,
        empresa: empresaType,
        availableSolutions
      }
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

  private normalizeRole(tipo?: string): UserRole {
    if (tipo === UserRole.ADMIN || tipo === UserRole.CLIENTE) {
      return tipo as UserRole;
    }

    return UserRole.USUARIO;
  }

  private resolveAvailableSolutions(tipo: UserRole, empresa?: EmpresaRecord | null): string[] {
    if (tipo === UserRole.ADMIN) {
      return ['ecommerce', 'projetos', 'horas', 'configurador'];
    }

    if (tipo === UserRole.CLIENTE && empresa) {
      return [
        empresa.acessoEcommerce !== false ? 'ecommerce' : null,
        empresa.acessoProjetos ? 'projetos' : null,
        empresa.acessoHoras ? 'horas' : null
      ].filter((solution): solution is string => !!solution);
    }

    if (tipo === UserRole.USUARIO) {
      return ['ecommerce'];
    }

    return [];
  }
}
