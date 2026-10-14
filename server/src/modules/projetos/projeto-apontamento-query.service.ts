import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { MeusProjetoApontamentosFiltroInput } from './dto/projeto-apontamento.input';
import {
  MeusProjetoApontamentosPageType,
  ProjetoApontamentoItemType,
  ProjetoApontamentoProjetoType,
  ProjetoApontamentoType
} from './dto/projeto-apontamento.type';
import { toProjetoApontamentoType, totalizarApontamentosDoPeriodo } from './mappers/projeto-apontamento.mapper';
import { resolveProjetoApontamentoAcoesDoAutor } from './policies/projeto-apontamento-status.policy';
import {
  ProjetoApontamentoAuthorizationService,
  ProjetoApontamentoPermissoesDoAutor
} from './projeto-apontamento-authorization.service';
import { ProjetoApontamentoPeriodoService } from './projeto-apontamento-periodo.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoApontamentoDetalheRecord, ProjetoApontamentoStatus } from './types/projeto-apontamento.types';
import { ProjetoPapel, ProjetoSituacao } from './types/projeto.types';

const ORDEM_DOS_APONTAMENTOS: Prisma.ProjetoApontamentoOrderByWithRelationInput[] = [
  { dataTrabalho: 'desc' },
  { criadoEm: 'desc' },
  { id: 'asc' }
];

@Injectable()
export class ProjetoApontamentoQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoApontamentoAuthorizationService,
    private readonly periodo: ProjetoPeriodoService,
    private readonly periodos: ProjetoApontamentoPeriodoService
  ) {}

  hojeOperacional(): string {
    return this.periodo.hojeOperacional();
  }

  async projetos(user: JwtPayload): Promise<ProjetoApontamentoProjetoType[]> {
    const empresaId = await this.authorization.assertAcaoDoAutor(user, ProjetoAcao.VISUALIZAR);
    const projetos = await this.prisma.projeto.findMany({
      where: this.authorization.filtroProjetosParaLancar(user, empresaId),
      select: { id: true, chave: true, nome: true, situacao: true, arquivadoEm: true },
      orderBy: [{ nome: 'asc' }, { chave: 'asc' }]
    });

    return projetos.map((projeto) => ({ ...projeto, situacao: projeto.situacao as ProjetoSituacao }));
  }

  async itens(projetoId: string, user: JwtPayload): Promise<ProjetoApontamentoItemType[]> {
    const empresaId = await this.authorization.assertAcaoDoAutor(user, ProjetoAcao.VISUALIZAR);
    const contexto = await this.authorization.projetoParaLancar(projetoId, user, empresaId);

    return this.prisma.projetoItem.findMany({
      where: await this.authorization.filtroItensParaLancar(user, contexto),
      select: { id: true, chave: true, titulo: true },
      orderBy: [{ ordemBacklog: 'asc' }, { numero: 'asc' }]
    });
  }

  /** Página dos próprios apontamentos. Os totais cobrem o período inteiro, de todos os projetos, sem os demais filtros. */
  async meus(user: JwtPayload, filtro: MeusProjetoApontamentosFiltroInput): Promise<MeusProjetoApontamentosPageType> {
    const empresaId = await this.authorization.assertAcaoDoAutor(user, ProjetoAcao.VISUALIZAR);
    const { inicio, fim } = this.periodo.periodoDeConsulta(filtro.inicio, filtro.fim);
    const { pagina, limite } = this.periodo.normalizePaginacao(filtro.pagina, filtro.limite);
    const doPeriodo: Prisma.ProjetoApontamentoWhereInput = {
      empresaId,
      usuarioId: user.sub,
      arquivadoEm: null,
      dataTrabalho: { gte: inicio, lte: fim }
    };
    const where: Prisma.ProjetoApontamentoWhereInput = {
      ...doPeriodo,
      ...(filtro.projetoId ? { projetoId: filtro.projetoId } : {}),
      ...(filtro.status ? { status: filtro.status } : {})
    };
    const [total, apontamentos, totaisAgrupados, permissoes] = await Promise.all([
      this.prisma.projetoApontamento.count({ where }),
      this.prisma.projetoApontamento.findMany({
        where,
        include: this.detalhe(user),
        orderBy: ORDEM_DOS_APONTAMENTOS,
        skip: (pagina - 1) * limite,
        take: limite
      }),
      this.prisma.projetoApontamento.groupBy({
        where: doPeriodo,
        by: ['dataTrabalho', 'projetoId'],
        _sum: { minutos: true }
      }),
      this.authorization.permissoesDoAutor(user)
    ]);
    const projetoIds = [...new Set(totaisAgrupados.map((total) => total.projetoId))];
    const projetos = projetoIds.length ? await this.prisma.projeto.findMany({
      where: { empresaId, id: { in: projetoIds } },
      select: { id: true, chave: true, nome: true }
    }) : [];
    const projetosPorId = new Map(projetos.map((projeto) => [projeto.id, projeto]));
    const lancados = totaisAgrupados.flatMap((total) => {
      const projeto = projetosPorId.get(total.projetoId);
      return projeto ? [{ dataTrabalho: total.dataTrabalho, minutos: total._sum.minutos ?? 0, projeto }] : [];
    });

    return {
      items: await this.comAcoes(apontamentos as unknown as ProjetoApontamentoDetalheRecord[], permissoes),
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      ...totalizarApontamentosDoPeriodo(lancados),
      permissoes: { podeIncluir: permissoes.podeIncluir }
    };
  }

  /** Apontamentos da própria pessoa, com as ações disponíveis, na ordem dos identificadores informados. */
  async doAutor(ids: string[], user: JwtPayload, empresaId: number): Promise<ProjetoApontamentoType[]> {
    const [apontamentos, permissoes] = await Promise.all([
      this.prisma.projetoApontamento.findMany({
        where: { id: { in: ids }, empresaId, usuarioId: user.sub },
        include: this.detalhe(user)
      }),
      this.authorization.permissoesDoAutor(user)
    ]);
    const tipos = new Map(
      (await this.comAcoes(apontamentos as unknown as ProjetoApontamentoDetalheRecord[], permissoes))
        .map((apontamento) => [apontamento.id, apontamento])
    );

    return ids.flatMap((id) => tipos.get(id) ?? []);
  }

  private detalhe(user: JwtPayload) {
    return {
      projeto: {
        select: {
          id: true,
          chave: true,
          nome: true,
          situacao: true,
          arquivadoEm: true,
          responsavelId: true,
          membros: { where: { usuarioId: user.sub }, select: { papel: true } }
        }
      },
      item: { select: { id: true, chave: true, titulo: true } },
      decididoPor: { select: { id: true, nome: true, login: true, email: true } }
    } satisfies Prisma.ProjetoApontamentoInclude;
  }

  private async comAcoes(
    apontamentos: ProjetoApontamentoDetalheRecord[],
    permissoes: ProjetoApontamentoPermissoesDoAutor
  ): Promise<ProjetoApontamentoType[]> {
    const emCompetenciaFechada = await this.periodos.emCompetenciaFechada(apontamentos);

    return apontamentos.map((apontamento) => {
      const competencia = this.periodos.competencia(apontamento);
      const papel = apontamento.projeto.responsavelId === apontamento.usuarioId
        ? ProjetoPapel.RESPONSAVEL
        : (apontamento.projeto.membros[0]?.papel as ProjetoPapel | undefined) ?? null;
      const acoes = resolveProjetoApontamentoAcoesDoAutor({
        status: apontamento.status as ProjetoApontamentoStatus,
        competencia,
        competenciaFechada: emCompetenciaFechada.has(apontamento),
        situacaoProjeto: apontamento.projeto.situacao as ProjetoSituacao,
        projetoArquivado: !!apontamento.projeto.arquivadoEm,
        lancaNoProjeto: this.authorization.lancaHoras(papel),
        podeAlterar: permissoes.podeAlterar,
        podeExcluir: permissoes.podeExcluir
      });

      return toProjetoApontamentoType(apontamento, competencia, acoes);
    });
  }
}
