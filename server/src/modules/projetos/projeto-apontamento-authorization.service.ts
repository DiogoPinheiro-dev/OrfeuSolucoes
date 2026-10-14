import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade, ProjetoFuncionalidadeSlug } from './constants/projeto-operacional.constants';
import { resolveMeuPapel } from './mappers/projeto.mapper';
import { PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS } from './policies/projeto-apontamento-status.policy';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoOrcamentoAuthorizationService } from './projeto-orcamento-authorization.service';
import { ProjetoRecursoHierarquiaService } from './projeto-recurso-hierarquia.service';
import { ProjetoPapel, ProjetoRecord } from './types/projeto.types';

const PROJECT_INCLUDE = { responsavel: true, criadoPor: true, arquivadoPor: true, membros: { include: { usuario: true } } };
const PAPEIS_QUE_LANCAM_HORAS: readonly (ProjetoPapel | null)[] = [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO];

export type ProjetoApontamentoContexto = { empresaId: number; projeto: ProjetoRecord; papel: ProjetoPapel | null };
export type ProjetoApontamentoPermissoesDoAutor = { podeIncluir: boolean; podeAlterar: boolean; podeExcluir: boolean };

/** De quem são os apontamentos que a pessoa acompanha no projeto: de todos ou só dos usuários listados. */
export type ProjetoApontamentoEscopo = { completo: boolean; usuarioIds: string[] };

export type ProjetoHorasPermissoes = {
  podeAprovar: boolean;
  podeReabrir: boolean;
  podeFecharPeriodo: boolean;
  podeVisualizarFinanceiro: boolean;
  podeGerenciarFinanceiro: boolean;
};

@Injectable()
export class ProjetoApontamentoAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoAuthorizationService,
    private readonly recursoHierarquia: ProjetoRecursoHierarquiaService,
    private readonly orcamentoAuthorization: ProjetoOrcamentoAuthorizationService
  ) {}

  /** Confere a ação em Meus apontamentos e devolve a empresa ativa. */
  assertAcaoDoAutor(user: JwtPayload, acao: string): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.MEUS_APONTAMENTOS, acao);
  }

  /** Confere a ação em Horas do projeto e devolve a empresa ativa. */
  assertAcaoNasHoras(user: JwtPayload, acao: string): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.HORAS, acao);
  }

  /**
   * Projeto da empresa ativa em que a pessoa lança horas: não arquivado e com participação como responsável ou
   * membro. O administrador do sistema também precisa participar, porque cada um lança só as próprias horas.
   */
  async projetoParaLancar(projetoId: string, user: JwtPayload, empresaId: number): Promise<ProjetoApontamentoContexto> {
    const contexto = await this.projetoVisivel(projetoId, user, empresaId);

    this.authorization.assertWritableProject(contexto.projeto);
    if (!this.lancaHoras(contexto.papel)) {
      throw new ForbiddenException('Somente o responsável e os membros do projeto lançam horas nele.');
    }

    return contexto;
  }

  /** Projeto visível da empresa ativa, para acompanhar as horas; arquivado continua disponível para consulta. */
  projetoDasHoras(projetoId: string, user: JwtPayload, empresaId: number): Promise<ProjetoApontamentoContexto> {
    return this.projetoVisivel(projetoId, user, empresaId);
  }

  /** Decisões e competências alteram dados: o projeto arquivado fica somente para consulta. */
  assertProjetoGravavel(contexto: ProjetoApontamentoContexto): void {
    this.authorization.assertWritableProject(contexto.projeto);
  }

  lancaHoras(papel: ProjetoPapel | null): boolean {
    return PAPEIS_QUE_LANCAM_HORAS.includes(papel);
  }

  filtroProjetosParaLancar(user: JwtPayload, empresaId: number): Prisma.ProjetoWhereInput {
    return {
      empresaId,
      arquivadoEm: null,
      situacao: { in: [...PROJETO_APONTAMENTO_CICLOS_ELEGIVEIS] },
      OR: [
        { responsavelId: user.sub },
        { membros: { some: { usuarioId: user.sub, papel: ProjetoPapel.MEMBRO } } }
      ]
    };
  }

  /** Projetos da empresa ativa visíveis para a pessoa em Horas do projeto. */
  filtroProjetosDasHoras(user: JwtPayload, empresaId: number, incluirArquivados: boolean): Prisma.ProjetoWhereInput {
    return {
      empresaId,
      ...this.authorization.visibilityWhere(user),
      ...(incluirArquivados ? {} : { arquivadoEm: null })
    };
  }

  /** Itens que a pessoa pode associar aos próprios apontamentos: do projeto, ativos e no escopo hierárquico dela. */
  async filtroItensParaLancar(user: JwtPayload, contexto: ProjetoApontamentoContexto): Promise<Prisma.ProjetoItemWhereInput> {
    const escopo = await this.recursoHierarquia.escopo(user, contexto.empresaId, contexto.projeto.id);

    return {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      arquivadoEm: null,
      ...this.recursoHierarquia.filtroProjetoItem(escopo)
    };
  }

  /**
   * O responsável do projeto e o administrador do sistema acompanham todos os apontamentos. O superior hierárquico
   * acompanha os próprios e os dos subordinados das equipes ativas do projeto. Os demais, só os próprios: horas de
   * pessoas são mais sensíveis que itens de trabalho, então quem não tem recurso não recebe visão completa.
   */
  async escopoDasHoras(user: JwtPayload, contexto: ProjetoApontamentoContexto): Promise<ProjetoApontamentoEscopo> {
    if (this.authorization.isSystemAdmin(user) || contexto.papel === ProjetoPapel.RESPONSAVEL) {
      return { completo: true, usuarioIds: [] };
    }

    const hierarquia = await this.recursoHierarquia.escopo(user, contexto.empresaId, contexto.projeto.id);

    return { completo: false, usuarioIds: hierarquia.restrito ? hierarquia.usuarioIds : [user.sub] };
  }

  filtroDoEscopo(escopo: ProjetoApontamentoEscopo): Prisma.ProjetoApontamentoWhereInput {
    return escopo.completo ? {} : { usuarioId: { in: escopo.usuarioIds } };
  }

  /** Só o responsável do projeto e o administrador do sistema fecham e reabrem as competências. */
  assertFechamentoDePeriodo(user: JwtPayload, contexto: ProjetoApontamentoContexto): void {
    if (!this.fechaPeriodos(user, contexto)) {
      throw new ForbiddenException('Somente o responsável do projeto fecha e reabre as competências.');
    }
  }

  /** Recalcular custos é uma operação financeira do orçamento: gerenciar_financeiro, como as demais. */
  async contextoFinanceiro(projetoId: string, user: JwtPayload): Promise<ProjetoApontamentoContexto> {
    const contexto = await this.orcamentoAuthorization.contexto(projetoId, user);
    await this.orcamentoAuthorization.gerenciarFinanceiro(contexto, user);
    return contexto;
  }

  async permissoesDoAutor(user: JwtPayload): Promise<ProjetoApontamentoPermissoesDoAutor> {
    const [podeIncluir, podeAlterar, podeExcluir] = await Promise.all([
      this.pode(() => this.assertAcaoDoAutor(user, ProjetoAcao.INCLUIR)),
      this.pode(() => this.assertAcaoDoAutor(user, ProjetoAcao.ALTERAR)),
      this.pode(() => this.assertAcaoDoAutor(user, ProjetoAcao.EXCLUIR))
    ]);

    return { podeIncluir, podeAlterar, podeExcluir };
  }

  /** Permissões efetivas em Horas do projeto. Projeto arquivado fica somente para consulta, inclusive no financeiro. */
  async permissoesDasHoras(user: JwtPayload, contexto: ProjetoApontamentoContexto): Promise<ProjetoHorasPermissoes> {
    const gravavel = !contexto.projeto.arquivadoEm;
    const naFuncionalidade = (funcionalidade: ProjetoFuncionalidadeSlug, acao: string) =>
      this.pode(() => this.authorization.assertFeatureActionAccess(user, funcionalidade, acao));
    const [aprovar, reabrir, fecharPeriodo, visualizarFinanceiro, gerenciarFinanceiro] = await Promise.all([
      naFuncionalidade(ProjetoFuncionalidade.HORAS, ProjetoAcao.APROVAR_HORAS),
      naFuncionalidade(ProjetoFuncionalidade.HORAS, ProjetoAcao.REABRIR_HORAS),
      this.fechaPeriodos(user, contexto) ? naFuncionalidade(ProjetoFuncionalidade.HORAS, ProjetoAcao.FECHAR_PERIODO) : false,
      this.authorization.isSystemAdmin(user) || naFuncionalidade(ProjetoFuncionalidade.ORCAMENTO, ProjetoAcao.VISUALIZAR_FINANCEIRO),
      gravavel && this.pode(() => this.orcamentoAuthorization.gerenciarFinanceiro(contexto, user))
    ]);

    return {
      podeAprovar: gravavel && aprovar,
      podeReabrir: gravavel && reabrir,
      podeFecharPeriodo: gravavel && fecharPeriodo,
      podeVisualizarFinanceiro: visualizarFinanceiro,
      podeGerenciarFinanceiro: gerenciarFinanceiro
    };
  }

  private async projetoVisivel(projetoId: string, user: JwtPayload, empresaId: number): Promise<ProjetoApontamentoContexto> {
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, empresaId },
      include: PROJECT_INCLUDE
    }) as unknown as ProjetoRecord | null;

    this.authorization.assertVisibleProject(projeto, user, empresaId);
    return { empresaId, projeto, papel: resolveMeuPapel(projeto, user.sub) };
  }

  private fechaPeriodos(user: JwtPayload, contexto: ProjetoApontamentoContexto): boolean {
    return this.authorization.isSystemAdmin(user) || contexto.papel === ProjetoPapel.RESPONSAVEL;
  }

  private async pode(verificar: () => Promise<unknown>): Promise<boolean> {
    try {
      await verificar();
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
