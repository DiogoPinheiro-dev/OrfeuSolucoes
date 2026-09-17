import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade, ProjetoFuncionalidadeSlug } from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoRecursoPermissoes } from './types/projeto-recurso.types';

export type ProjetoRecursoContexto = {
  empresaId: number;
  projeto: { id: string; arquivadoEm: Date | null };
};

export type ProjetoOrganizacaoAcesso = {
  empresaId: number;
  recursos: boolean;
  equipes: boolean;
};

@Injectable()
export class ProjetoRecursoAuthorizationService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjetoAuthorizationService) {}

  empresa(
    user: JwtPayload,
    action: string = ProjetoAcao.VISUALIZAR,
    funcionalidade: ProjetoFuncionalidadeSlug = ProjetoFuncionalidade.PLANEJAMENTO_RECURSOS
  ): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, funcionalidade, action);
  }

  /** O painel de organização atende Recursos e Equipes: basta visualizar uma das duas funcionalidades. */
  async acessoPainel(user: JwtPayload): Promise<ProjetoOrganizacaoAcesso> {
    const [recursos, equipes] = await Promise.all([
      this.empresaSePermitida(user, ProjetoFuncionalidade.PLANEJAMENTO_RECURSOS),
      this.empresaSePermitida(user, ProjetoFuncionalidade.EQUIPES)
    ]);
    const empresaId = recursos.empresaId ?? equipes.empresaId;
    if (empresaId === null) throw recursos.erro ?? new ForbiddenException('Usuario sem permissao para executar esta acao.');
    return { empresaId, recursos: recursos.empresaId !== null, equipes: equipes.empresaId !== null };
  }

  async contexto(projetoId: string, user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<ProjetoRecursoContexto> {
    const empresaId = await this.empresa(user, action);
    const projeto = await this.prisma.projeto.findFirst({ where: { id: projetoId, empresaId }, select: { id: true, arquivadoEm: true } });
    if (!projeto) throw new NotFoundException('Projeto nao encontrado.');
    return { empresaId, projeto };
  }

  async permissoes(
    user: JwtPayload,
    funcionalidade: ProjetoFuncionalidadeSlug = ProjetoFuncionalidade.PLANEJAMENTO_RECURSOS
  ): Promise<ProjetoRecursoPermissoes> {
    if (this.authorization.isSystemAdmin(user)) return { podeIncluir: true, podeAlterar: true, podeExcluir: true };
    const [incluir, alterar, excluir] = await Promise.all([
      this.can(() => this.empresa(user, ProjetoAcao.INCLUIR, funcionalidade).then(() => undefined)),
      this.can(() => this.empresa(user, ProjetoAcao.ALTERAR, funcionalidade).then(() => undefined)),
      this.can(() => this.empresa(user, ProjetoAcao.EXCLUIR, funcionalidade).then(() => undefined))
    ]);
    return { podeIncluir: incluir, podeAlterar: alterar, podeExcluir: excluir };
  }

  isSystemAdmin(user: { padraoSistema?: boolean | null }) { return this.authorization.isSystemAdmin(user); }
  groupHasProjectAccess(group: Parameters<ProjetoAuthorizationService['groupHasProjectAccess']>[0]) { return this.authorization.groupHasProjectAccess(group); }

  private async empresaSePermitida(
    user: JwtPayload,
    funcionalidade: ProjetoFuncionalidadeSlug
  ): Promise<{ empresaId: number | null; erro?: ForbiddenException }> {
    try { return { empresaId: await this.empresa(user, ProjetoAcao.VISUALIZAR, funcionalidade) }; }
    catch (error) { if (error instanceof ForbiddenException) return { empresaId: null, erro: error }; throw error; }
  }

  private async can(operation: () => Promise<void>): Promise<boolean> {
    try { await operation(); return true; }
    catch (error) { if (error instanceof ForbiddenException) return false; throw error; }
  }
}
