import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hasFullGroupAccess } from '../users/policies/user.policy';
import { JwtPayload } from './strategies/jwt-payload.type';

@Injectable()
export class AuthTokenValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !Number.isInteger(payload.sessaoVersao)) {
      throw this.invalidSession();
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        login: true,
        nome: true,
        grupoId: true,
        deveAlterarSenha: true,
        sessaoVersao: true,
        padraoSistema: true,
        grupo: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            acessoEcommerce: true,
            acessoProjetos: true,
            acessoHoras: true,
            acessoConfigurador: true,
            podeVisualizar: true,
            podeIncluir: true,
            podeAlterar: true,
            podeExcluir: true
          }
        }
      }
    });

    if (!user) {
      throw this.invalidSession();
    }

    const tokenGroupId = payload.grupo?.id ?? null;
    const currentClaimsMatch =
      payload.sessaoVersao === user.sessaoVersao &&
      payload.email === user.email &&
      (payload.login ?? null) === (user.login ?? null) &&
      tokenGroupId === user.grupoId &&
      payload.padraoSistema === user.padraoSistema;

    if (!currentClaimsMatch) {
      throw this.invalidSession();
    }

    if (payload.empresaId !== undefined && payload.empresaId !== null) {
      const membership = await this.prisma.empresaUsuario.findUnique({
        where: {
          empresaId_usuarioId: {
            empresaId: payload.empresaId,
            usuarioId: payload.sub
          }
        },
        select: { id: true }
      });

      if (!membership) {
        throw this.invalidSession();
      }
    }

    const currentGroup = user.grupo
      ? {
          id: user.grupo.id,
          nome: user.grupo.nome,
          descricao: user.grupo.descricao,
          acessoEcommerce: user.grupo.acessoEcommerce,
          acessoProjetos: user.grupo.acessoProjetos,
          acessoHoras: user.grupo.acessoHoras,
          acessoConfigurador: user.grupo.acessoConfigurador,
          podeVisualizar: user.grupo.podeVisualizar,
          podeIncluir: user.grupo.podeIncluir,
          podeAlterar: user.grupo.podeAlterar,
          podeExcluir: user.grupo.podeExcluir
        }
      : null;
    const fullGroupAccess = hasFullGroupAccess(currentGroup);

    return {
      ...payload,
      email: user.email,
      login: user.login,
      nome: user.nome,
      padraoSistema: user.padraoSistema,
      deveAlterarSenha: user.deveAlterarSenha,
      sessaoVersao: user.sessaoVersao,
      grupo: currentGroup,
      podeVisualizar: fullGroupAccess || (currentGroup?.podeVisualizar ?? false),
      podeIncluir: fullGroupAccess || (currentGroup?.podeIncluir ?? false),
      podeAlterar: fullGroupAccess || (currentGroup?.podeAlterar ?? false),
      podeExcluir: fullGroupAccess || (currentGroup?.podeExcluir ?? false),
      availableSolutions: undefined
    };
  }

  private invalidSession(): UnauthorizedException {
    return new UnauthorizedException('Sessao invalida ou revogada.');
  }
}
