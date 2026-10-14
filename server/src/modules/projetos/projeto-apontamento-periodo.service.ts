import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { runSerializableTransaction } from '../../common/persistence/serializable-transaction.util';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { FecharProjetoApontamentoPeriodoInput, ReabrirProjetoApontamentoPeriodoInput } from './dto/projeto-horas.input';
import { ProjetoApontamentoCompetenciaType } from './dto/projeto-horas.type';
import { toProjetoUsuarioType } from './mappers/projeto.mapper';
import { normalizeMotivoApontamento } from './policies/projeto-apontamento-limite.policy';
import { formatCompetencia } from './policies/projeto-input.policy';
import {
  ProjetoApontamentoAuthorizationService,
  ProjetoApontamentoContexto,
  ProjetoApontamentoEscopo
} from './projeto-apontamento-authorization.service';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoApontamentoPeriodoSituacao, ProjetoApontamentoStatus } from './types/projeto-apontamento.types';

export type ProjetoApontamentoNoMes = { projetoId: string; dataTrabalho: Date };

type PeriodoClient = Pick<Prisma.TransactionClient, 'projetoApontamentoPeriodo'>;
type CompetenciasClient = Pick<Prisma.TransactionClient, 'projetoApontamentoPeriodo' | 'projetoApontamento'>;

const USUARIO_SELECT = { id: true, nome: true, login: true, email: true };
const PERIODO_INCLUDE = {
  fechadoPor: { select: USUARIO_SELECT },
  reabertoPor: { select: USUARIO_SELECT }
} satisfies Prisma.ProjetoApontamentoPeriodoInclude;
const ESCOPO_COMPLETO: ProjetoApontamentoEscopo = { completo: true, usuarioIds: [] };

@Injectable()
export class ProjetoApontamentoPeriodoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly periodo: ProjetoPeriodoService,
    private readonly authorization: ProjetoApontamentoAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService
  ) {}

  competencia(apontamento: Pick<ProjetoApontamentoNoMes, 'dataTrabalho'>): string {
    return this.periodo.competenciaDaData(apontamento.dataTrabalho);
  }

  /** Os apontamentos informados que caem numa competência fechada do projeto. Competência sem registro está aberta. */
  async emCompetenciaFechada<T extends ProjetoApontamentoNoMes>(
    apontamentos: readonly T[],
    db: PeriodoClient = this.prisma
  ): Promise<Set<T>> {
    if (!apontamentos.length) {
      return new Set();
    }

    const periodos = await db.projetoApontamentoPeriodo.findMany({
      where: {
        projetoId: { in: [...new Set(apontamentos.map((apontamento) => apontamento.projetoId))] },
        competencia: { in: [...new Set(apontamentos.map((apontamento) => this.competencia(apontamento)))] },
        situacao: ProjetoApontamentoPeriodoSituacao.FECHADO
      },
      select: { projetoId: true, competencia: true }
    });
    const fechadas = new Set(periodos.map((periodo) => `${periodo.projetoId}:${periodo.competencia}`));

    return new Set(apontamentos.filter((apontamento) =>
      fechadas.has(`${apontamento.projetoId}:${this.competencia(apontamento)}`)
    ));
  }

  /**
   * Situação de cada competência alcançada pelo período, com os minutos e os enviados pendentes do mês inteiro no
   * escopo de quem consulta. Só fecha o mês já iniciado e sem enviados aguardando decisão.
   */
  async situacoes(
    contexto: ProjetoApontamentoContexto,
    periodo: { inicio: Date; fim: Date },
    escopo: ProjetoApontamentoEscopo,
    podeFecharPeriodo: boolean,
    db: CompetenciasClient = this.prisma
  ): Promise<ProjetoApontamentoCompetenciaType[]> {
    const { competencias, situacaoDe } = await this.carregarSituacoes(contexto, periodo, escopo, podeFecharPeriodo, db);
    return competencias.map(situacaoDe);
  }

  /** Fecha a competência do projeto; os apontamentos datados naquele mês passam a ser somente para consulta. */
  async fechar(input: FecharProjetoApontamentoPeriodoInput, user: JwtPayload): Promise<ProjetoApontamentoCompetenciaType> {
    const contexto = await this.contextoDoFechamento(input.projetoId, user);
    const competencia = this.periodo.normalizeCompetencia(input.competencia);
    if (competencia > this.periodo.competenciaAtual()) {
      throw new BadRequestException(`A competência ${formatCompetencia(competencia)} ainda não começou.`);
    }
    const { inicio, fimExclusivo } = this.periodo.limitesDaCompetencia(competencia);

    return this.emTransacao(async (tx) => {
      const enviados = await tx.projetoApontamento.count({
        where: {
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id,
          arquivadoEm: null,
          status: ProjetoApontamentoStatus.ENVIADO,
          dataTrabalho: { gte: inicio, lt: fimExclusivo }
        }
      });
      if (enviados > 0) {
        throw new BadRequestException(
          `A competência ${formatCompetencia(competencia)} tem ${enviados} apontamento(s) enviado(s) aguardando decisão. Aprove ou rejeite antes de fechar.`
        );
      }

      const atual = await this.registro(tx, contexto, competencia);
      if (atual?.situacao === ProjetoApontamentoPeriodoSituacao.FECHADO) {
        throw new ConflictException(`A competência ${formatCompetencia(competencia)} já está fechada. Atualize os dados.`);
      }

      const fechamento = { situacao: ProjetoApontamentoPeriodoSituacao.FECHADO, fechadoPorId: user.sub, fechadoEm: new Date() };
      const id = atual
        ? await this.atualizarVersao(tx, atual.id, atual.versao, fechamento)
        : (await tx.projetoApontamentoPeriodo.create({
            data: { ...fechamento, empresaId: contexto.empresaId, projetoId: contexto.projeto.id, competencia }
          })).id;
      await this.registrar(tx, contexto, user, id, 'FECHADA', { competencia });

      return this.situacaoDepoisDaMudanca(tx, contexto, competencia);
    });
  }

  /** Reabre a competência fechada, com motivo; a versão protege contra uma decisão tomada sobre dados antigos. */
  async reabrir(input: ReabrirProjetoApontamentoPeriodoInput, user: JwtPayload): Promise<ProjetoApontamentoCompetenciaType> {
    const contexto = await this.contextoDoFechamento(input.projetoId, user);
    const competencia = this.periodo.normalizeCompetencia(input.competencia);
    const motivo = normalizeMotivoApontamento(input.motivo);

    return this.emTransacao(async (tx) => {
      const atual = await this.registro(tx, contexto, competencia);
      if (!atual || atual.situacao !== ProjetoApontamentoPeriodoSituacao.FECHADO) {
        throw new BadRequestException(`A competência ${formatCompetencia(competencia)} não está fechada.`);
      }

      await this.atualizarVersao(tx, atual.id, input.versao, {
        situacao: ProjetoApontamentoPeriodoSituacao.REABERTO,
        reabertoPorId: user.sub,
        reabertoEm: new Date(),
        motivoReabertura: motivo
      });
      await this.registrar(tx, contexto, user, atual.id, 'REABERTA', { competencia, motivo });

      return this.situacaoDepoisDaMudanca(tx, contexto, competencia);
    });
  }

  private async contextoDoFechamento(projetoId: string, user: JwtPayload): Promise<ProjetoApontamentoContexto> {
    const empresaId = await this.authorization.assertAcaoNasHoras(user, ProjetoAcao.FECHAR_PERIODO);
    const contexto = await this.authorization.projetoDasHoras(projetoId, user, empresaId);

    this.authorization.assertProjetoGravavel(contexto);
    this.authorization.assertFechamentoDePeriodo(user, contexto);
    return contexto;
  }

  private registro(tx: Prisma.TransactionClient, contexto: ProjetoApontamentoContexto, competencia: string) {
    return tx.projetoApontamentoPeriodo.findUnique({
      where: { projetoId_competencia: { projetoId: contexto.projeto.id, competencia } }
    });
  }

  /** Quem fecha e reabre é o responsável ou o administrador, que acompanham todos os apontamentos do projeto. */
  private async situacaoDepoisDaMudanca(
    tx: Prisma.TransactionClient,
    contexto: ProjetoApontamentoContexto,
    competencia: string
  ): Promise<ProjetoApontamentoCompetenciaType> {
    const { inicio } = this.periodo.limitesDaCompetencia(competencia);
    const { situacaoDe } = await this.carregarSituacoes(contexto, { inicio, fim: inicio }, ESCOPO_COMPLETO, true, tx);

    return situacaoDe(competencia);
  }

  private async carregarSituacoes(
    contexto: ProjetoApontamentoContexto,
    periodo: { inicio: Date; fim: Date },
    escopo: ProjetoApontamentoEscopo,
    podeFecharPeriodo: boolean,
    db: CompetenciasClient
  ): Promise<{ competencias: string[]; situacaoDe: (competencia: string) => ProjetoApontamentoCompetenciaType }> {
    const competencias = this.periodo.competenciasDoPeriodo(periodo.inicio, periodo.fim);
    const [registros, apontamentos] = await Promise.all([
      db.projetoApontamentoPeriodo.findMany({
        where: { projetoId: contexto.projeto.id, competencia: { in: competencias } },
        include: PERIODO_INCLUDE
      }),
      db.projetoApontamento.groupBy({
        where: {
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id,
          arquivadoEm: null,
          dataTrabalho: {
            gte: this.periodo.limitesDaCompetencia(this.periodo.competenciaDaData(periodo.inicio)).inicio,
            lt: this.periodo.limitesDaCompetencia(this.periodo.competenciaDaData(periodo.fim)).fimExclusivo
          },
          ...this.authorization.filtroDoEscopo(escopo)
        },
        by: ['dataTrabalho', 'status'],
        _sum: { minutos: true },
        _count: { _all: true }
      })
    ]);
    const atual = this.periodo.competenciaAtual();

    const situacaoDe = (competencia: string): ProjetoApontamentoCompetenciaType => {
      const registro = registros.find((candidato) => candidato.competencia === competencia) ?? null;
      const doMes = apontamentos.filter((apontamento) => this.competencia(apontamento) === competencia);
      const enviadosPendentes = doMes
        .filter((apontamento) => apontamento.status === ProjetoApontamentoStatus.ENVIADO)
        .reduce((total, apontamento) => total + apontamento._count._all, 0);
      const fechada = registro?.situacao === ProjetoApontamentoPeriodoSituacao.FECHADO;
      const bloqueio = podeFecharPeriodo && !fechada ? this.motivoParaNaoFechar(competencia, atual, enviadosPendentes) : null;

      return {
        competencia,
        fechada,
        situacao: (registro?.situacao as ProjetoApontamentoPeriodoSituacao | undefined) ?? null,
        versao: registro?.versao ?? null,
        fechadoEm: registro?.fechadoEm ?? null,
        fechadoPor: registro ? toProjetoUsuarioType(registro.fechadoPor) : null,
        reabertoEm: registro?.reabertoEm ?? null,
        reabertoPor: registro?.reabertoPor ? toProjetoUsuarioType(registro.reabertoPor) : null,
        motivoReabertura: registro?.motivoReabertura ?? null,
        minutos: doMes.reduce((total, apontamento) => total + (apontamento._sum.minutos ?? 0), 0),
        enviadosPendentes,
        podeFechar: podeFecharPeriodo && !fechada && !bloqueio,
        podeReabrir: podeFecharPeriodo && fechada,
        bloqueio
      };
    };

    return { competencias, situacaoDe };
  }

  private motivoParaNaoFechar(competencia: string, competenciaAtual: string, enviadosPendentes: number): string | null {
    if (competencia > competenciaAtual) {
      return `A competência ${formatCompetencia(competencia)} ainda não começou.`;
    }
    if (enviadosPendentes > 0) {
      return `Há ${enviadosPendentes} apontamento(s) enviado(s) aguardando decisão na competência ${formatCompetencia(competencia)}.`;
    }

    return null;
  }

  private async atualizarVersao(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: Prisma.ProjetoApontamentoPeriodoUncheckedUpdateManyInput
  ): Promise<string> {
    const { count } = await tx.projetoApontamentoPeriodo.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } }
    });
    if (count !== 1) {
      throw new ConflictException('A competência foi alterada por outra pessoa. Atualize os dados.');
    }

    return id;
  }

  private registrar(
    tx: Prisma.TransactionClient,
    contexto: ProjetoApontamentoContexto,
    user: JwtPayload,
    periodoId: string,
    evento: string,
    dados: unknown
  ): Promise<unknown> {
    return this.auditoria.registrar(tx, {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      usuarioId: user.sub,
      entidade: 'APONTAMENTO_PERIODO',
      entidadeId: periodoId,
      evento,
      dados
    });
  }

  /** Serializável: a contagem de enviados do mês e o registro da competência não correm contra um envio simultâneo. */
  private emTransacao<T>(operacao: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return runSerializableTransaction(
      this.prisma,
      operacao,
      'Outra operação alterou as competências ou os apontamentos deste projeto ao mesmo tempo. Atualize os dados e tente de novo.'
    );
  }
}
