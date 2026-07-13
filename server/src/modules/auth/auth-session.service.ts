import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { EmpresasService } from '../empresas/empresas.service';
import { SolucoesService } from '../solucoes/solucoes.service';
import { UserType } from '../users/dto/user.type';
import { UsersService } from '../users/users.service';
import { AuthPayloadType } from './dto/auth-payload.type';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private readonly solucoesService: SolucoesService,
    private readonly jwtService: JwtService
  ) {}

  async buildAuthPayload(
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
