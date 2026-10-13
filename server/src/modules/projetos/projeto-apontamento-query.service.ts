import { BadRequestException, Injectable } from '@nestjs/common';
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
import { normalizeCalendarDate } from './policies/projeto-input.policy';
import {
  ProjetoApontamentoAuthorizationService,
  ProjetoApontamentoPermissoesDoAutor
} from './projeto-apontamento-authorization.service';
import { ProjetoApontamentoPeriodoService } from './projeto-apontamento-periodo.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoApontamentoDetalheRecord, ProjetoApontamentoStatus } from './types/projeto-apontamento.types';
import { ProjetoPapel, ProjetoSituacao } from './types/projeto.types';

const PERIODO_MAXIMO_EM_DIAS = 366;
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
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
    const { inicio, fim } = this.periodoConsultado(filtro);
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
    const [total, apontamentos, lancados, permissoes] = await Promise.all([
      this.prisma.projetoApontamento.count({ where }),
      this.prisma.projetoApontamento.findMany({
        where,
        include: this.detalhe(user),
        orderBy: ORDEM_DOS_APONTAMENTOS,
        skip: (pagina - 1) * limite,
        take: limite
      }),
      this.prisma.projetoApontamento.findMany({
        where: doPeriodo,
        select: { dataTrabalho: true, minutos: true, projeto: { select: { id: true, chave: true, nome: true } } }
      }),
      this.authorization.permissoesDoAutor(user)
    ]);

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

  private periodoConsultado(filtro: MeusProjetoApontamentosFiltroInput): { inicio: Date; fim: Date } {
    const inicio = normalizeCalendarDate(filtro.inicio);
    const fim = normalizeCalendarDate(filtro.fim);

    if (!inicio || !fim) {
      throw new BadRequestException('Informe o primeiro e o último dia do período.');
    }

    this.periodo.assertPeriodoValido(inicio, fim);
    if ((fim.getTime() - inicio.getTime()) / UM_DIA_EM_MS + 1 > PERIODO_MAXIMO_EM_DIAS) {
      throw new BadRequestException(`Consulte no máximo ${PERIODO_MAXIMO_EM_DIAS} dias por vez.`);
    }

    return { inicio, fim };
  }
}
