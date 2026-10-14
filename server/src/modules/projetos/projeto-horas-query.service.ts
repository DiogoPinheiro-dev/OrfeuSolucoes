import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { ProjetoApontamentoProjetoType } from './dto/projeto-apontamento.type';
import { ProjetoHorasFiltroInput } from './dto/projeto-horas.input';
import { ProjetoHorasApontamentoType, ProjetoHorasFinanceiroType, ProjetoHorasPageType } from './dto/projeto-horas.type';
import { custoDaLinha, resumirCustoDasHoras } from './mappers/projeto-apontamento-custo.mapper';
import {
  ProjetoApontamentoLancado,
  toProjetoApontamentoCustoType,
  toProjetoHorasApontamentoType,
  toProjetoHorasLinhaCustoType,
  totalizarCustoDasHoras,
  totalizarHorasDoProjeto
} from './mappers/projeto-horas.mapper';
import { resolveProjetoApontamentoAcoesDoGestor } from './policies/projeto-apontamento-status.policy';
import {
  ProjetoApontamentoAuthorizationService,
  ProjetoApontamentoContexto,
  ProjetoHorasPermissoes
} from './projeto-apontamento-authorization.service';
import { ProjetoApontamentoPeriodoService } from './projeto-apontamento-periodo.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoApontamentoStatus, ProjetoHorasApontamentoRecord } from './types/projeto-apontamento.types';
import { ProjetoCustoTipo } from './types/projeto-orcamento.types';
import { ProjetoSituacao } from './types/projeto.types';

const USUARIO_SELECT = { id: true, nome: true, login: true, email: true };
const ITEM_SELECT = { id: true, chave: true, titulo: true };
const DETALHE = {
  usuario: { select: USUARIO_SELECT },
  item: { select: ITEM_SELECT },
  decididoPor: { select: USUARIO_SELECT }
} satisfies Prisma.ProjetoApontamentoInclude;
const ORDEM_DOS_APONTAMENTOS: Prisma.ProjetoApontamentoOrderByWithRelationInput[] = [
  { dataTrabalho: 'desc' },
  { criadoEm: 'desc' },
  { id: 'asc' }
];

/** Consultas de Horas do projeto: a visão de quem acompanha, aprova e fecha as horas do projeto. */
@Injectable()
export class ProjetoHorasQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoApontamentoAuthorizationService,
    private readonly periodo: ProjetoPeriodoService,
    private readonly periodos: ProjetoApontamentoPeriodoService
  ) {}

  async projetos(user: JwtPayload, incluirArquivados: boolean): Promise<ProjetoApontamentoProjetoType[]> {
    const empresaId = await this.authorization.assertAcaoNasHoras(user, ProjetoAcao.VISUALIZAR);
    const projetos = await this.prisma.projeto.findMany({
      where: this.authorization.filtroProjetosDasHoras(user, empresaId, incluirArquivados),
      select: { id: true, chave: true, nome: true, situacao: true, arquivadoEm: true },
      orderBy: [{ nome: 'asc' }, { chave: 'asc' }]
    });

    return projetos.map((projeto) => ({ ...projeto, situacao: projeto.situacao as ProjetoSituacao }));
  }

  /**
   * Página dos apontamentos do projeto no escopo de quem consulta. Os totais e o custo seguem o período e os filtros;
   * as competências cobrem o mês inteiro, e as linhas de custo e os pendentes de custo, o projeto inteiro.
   */
  async painel(filtro: ProjetoHorasFiltroInput, user: JwtPayload): Promise<ProjetoHorasPageType> {
    const empresaId = await this.authorization.assertAcaoNasHoras(user, ProjetoAcao.VISUALIZAR);
    const contexto = await this.authorization.projetoDasHoras(filtro.projetoId, user, empresaId);
    const periodo = this.periodo.periodoDeConsulta(filtro.inicio, filtro.fim);
    const { pagina, limite } = this.periodo.normalizePaginacao(filtro.pagina, filtro.limite);
    const [escopo, permissoes] = await Promise.all([
      this.authorization.escopoDasHoras(user, contexto),
      this.authorization.permissoesDasHoras(user, contexto)
    ]);
    const where: Prisma.ProjetoApontamentoWhereInput = {
      empresaId,
      projetoId: contexto.projeto.id,
      arquivadoEm: null,
      dataTrabalho: { gte: periodo.inicio, lte: periodo.fim },
      AND: [this.authorization.filtroDoEscopo(escopo), this.filtros(filtro)]
    };
    const [total, apontamentos, lancadosAgrupados, competencias] = await Promise.all([
      this.prisma.projetoApontamento.count({ where }),
      this.prisma.projetoApontamento.findMany({
        where,
        include: DETALHE,
        orderBy: ORDEM_DOS_APONTAMENTOS,
        skip: (pagina - 1) * limite,
        take: limite
      }),
      this.prisma.projetoApontamento.groupBy({
        where,
        by: ['usuarioId', 'itemId', 'status', 'custoSituacao'],
        _sum: { minutos: true, valorCusto: true }
      }),
      this.periodos.situacoes(contexto, periodo, escopo, permissoes.podeFecharPeriodo)
    ]);
    const usuarioIds = [...new Set(lancadosAgrupados.map((total) => total.usuarioId))];
    const itemIds = [...new Set(lancadosAgrupados.flatMap((total) => total.itemId ? [total.itemId] : []))];
    const [usuarios, itens] = await Promise.all([
      usuarioIds.length ? this.prisma.usuario.findMany({ where: { id: { in: usuarioIds } }, select: USUARIO_SELECT }) : [],
      itemIds.length ? this.prisma.projetoItem.findMany({
        where: { empresaId, projetoId: contexto.projeto.id, id: { in: itemIds } },
        select: ITEM_SELECT
      }) : []
    ]);
    const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
    const itensPorId = new Map(itens.map((item) => [item.id, item]));
    const lancados: ProjetoApontamentoLancado[] = lancadosAgrupados.flatMap((total) => {
      const usuario = usuariosPorId.get(total.usuarioId);
      if (!usuario) return [];
      return [{
        usuarioId: total.usuarioId,
        itemId: total.itemId,
        minutos: total._sum.minutos ?? 0,
        status: total.status,
        custoSituacao: total.custoSituacao,
        valorCusto: total._sum.valorCusto,
        usuario,
        item: total.itemId ? itensPorId.get(total.itemId) ?? null : null
      }];
    });

    return {
      items: await this.comAcoes(apontamentos, user, contexto, permissoes),
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      ...totalizarHorasDoProjeto(lancados),
      competencias,
      permissoes,
      financeiro: permissoes.podeVisualizarFinanceiro ? await this.financeiro(contexto, lancados) : null
    };
  }

  /** Apontamentos do projeto no escopo de quem consulta, com as decisões disponíveis, na ordem informada. */
  async doProjeto(ids: readonly string[], user: JwtPayload, contexto: ProjetoApontamentoContexto): Promise<ProjetoHorasApontamentoType[]> {
    const [escopo, permissoes] = await Promise.all([
      this.authorization.escopoDasHoras(user, contexto),
      this.authorization.permissoesDasHoras(user, contexto)
    ]);
    const apontamentos = await this.prisma.projetoApontamento.findMany({
      where: {
        id: { in: [...ids] },
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        ...this.authorization.filtroDoEscopo(escopo)
      },
      include: DETALHE
    });
    const tipos = new Map(
      (await this.comAcoes(apontamentos, user, contexto, permissoes))
        .map((apontamento) => [apontamento.id, apontamento])
    );

    return ids.flatMap((id) => tipos.get(id) ?? []);
  }

  private filtros(filtro: ProjetoHorasFiltroInput): Prisma.ProjetoApontamentoWhereInput {
    return {
      ...(filtro.usuarioId ? { usuarioId: filtro.usuarioId } : {}),
      ...(filtro.itemId ? { itemId: filtro.itemId } : {}),
      ...(filtro.status ? { status: filtro.status } : {}),
      ...(typeof filtro.faturavel === 'boolean' ? { faturavel: filtro.faturavel } : {})
    };
  }

  private async comAcoes(
    apontamentos: ProjetoHorasApontamentoRecord[],
    user: JwtPayload,
    contexto: ProjetoApontamentoContexto,
    permissoes: ProjetoHorasPermissoes
  ): Promise<ProjetoHorasApontamentoType[]> {
    const emCompetenciaFechada = await this.periodos.emCompetenciaFechada(apontamentos);

    return apontamentos.map((apontamento) => {
      const competencia = this.periodos.competencia(apontamento);
      const acoes = resolveProjetoApontamentoAcoesDoGestor({
        status: apontamento.status as ProjetoApontamentoStatus,
        competencia,
        competenciaFechada: emCompetenciaFechada.has(apontamento),
        situacaoProjeto: contexto.projeto.situacao as ProjetoSituacao,
        projetoArquivado: !!contexto.projeto.arquivadoEm,
        atorEhAutor: apontamento.usuarioId === user.sub,
        podeAprovarHoras: permissoes.podeAprovar,
        podeReabrirHoras: permissoes.podeReabrir
      });
      const custo = permissoes.podeVisualizarFinanceiro ? toProjetoApontamentoCustoType(apontamento) : null;

      return toProjetoHorasApontamentoType(apontamento, competencia, acoes, custo);
    });
  }

  /** Bloco financeiro: só existe para quem tem visualizar_financeiro no Orçamento do projeto. */
  private async financeiro(
    contexto: ProjetoApontamentoContexto,
    lancados: readonly ProjetoApontamentoLancado[]
  ): Promise<ProjetoHorasFinanceiroType> {
    const [orcamento, aprovados] = await Promise.all([
      this.prisma.projetoOrcamento.findUnique({
        where: { projetoId: contexto.projeto.id },
        select: {
          moeda: true,
          custos: {
            where: { tipo: ProjetoCustoTipo.RECURSO },
            select: {
              id: true,
              descricao: true,
              quantidadeMinutos: true,
              taxaHora: true,
              valorPlanejado: true,
              item: { select: ITEM_SELECT },
              recurso: { select: { cadastro: { select: { usuario: { select: USUARIO_SELECT } } } } }
            },
            orderBy: { descricao: 'asc' }
          }
        }
      }),
      this.prisma.projetoApontamento.groupBy({
        where: { empresaId: contexto.empresaId, projetoId: contexto.projeto.id, status: ProjetoApontamentoStatus.APROVADO },
        by: ['custoId', 'custoSituacao'],
        _sum: { minutos: true, valorCusto: true },
        _count: { _all: true }
      })
    ]);
    const horas = resumirCustoDasHoras(aprovados.map((total) => ({
      custoId: total.custoId,
      custoSituacao: total.custoSituacao,
      minutos: total._sum.minutos ?? 0,
      valorCusto: total._sum.valorCusto,
      quantidade: total._count._all
    })));

    return {
      moeda: orcamento?.moeda ?? null,
      ...totalizarCustoDasHoras(lancados),
      linhas: (orcamento?.custos ?? []).map((linha) => toProjetoHorasLinhaCustoType(linha, custoDaLinha(horas, linha.id))),
      apontamentosSemCusto: horas.semCusto
    };
  }
}
