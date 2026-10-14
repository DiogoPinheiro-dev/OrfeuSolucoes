import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { runSerializableTransaction } from '../../common/persistence/serializable-transaction.util';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { VersionarProjetoApontamentoInput } from './dto/projeto-apontamento.input';
import {
  AprovarProjetoApontamentosInput,
  ReabrirProjetoApontamentoInput,
  RejeitarProjetoApontamentosInput
} from './dto/projeto-horas.input';
import { ProjetoHorasApontamentoType } from './dto/projeto-horas.type';
import { normalizeMotivoApontamento } from './policies/projeto-apontamento-limite.policy';
import { formatarDecimal } from './policies/projeto-dinheiro.policy';
import { resolveProjetoApontamentoTransicao } from './policies/projeto-apontamento-status.policy';
import {
  ProjetoApontamentoAuthorizationService,
  ProjetoApontamentoContexto,
  ProjetoApontamentoEscopo
} from './projeto-apontamento-authorization.service';
import { ProjetoApontamentoCustoService } from './projeto-apontamento-custo.service';
import { ProjetoApontamentoPeriodoService } from './projeto-apontamento-periodo.service';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoHorasQueryService } from './projeto-horas-query.service';
import { ProjetoIdempotenciaService } from './projeto-idempotencia.service';
import {
  PROJETO_APONTAMENTO_SEM_CUSTO,
  ProjetoApontamentoCusto,
  ProjetoApontamentoCustoSituacao,
  ProjetoApontamentoOperacao,
  ProjetoApontamentoRecord,
  ProjetoApontamentoStatus
} from './types/projeto-apontamento.types';
import { ProjetoSituacao } from './types/projeto.types';

const APONTAMENTO_NAO_ENCONTRADO = 'Apontamento não encontrado.';
const VERSAO_DESATUALIZADA = 'O apontamento foi alterado em outra tela ou por outra pessoa. Atualize os dados.';

type Decisao = {
  operacao: ProjetoApontamentoOperacao.APROVAR | ProjetoApontamentoOperacao.REJEITAR;
  idempotencia: 'APROVAR_APONTAMENTOS' | 'REJEITAR_APONTAMENTOS';
  evento: 'APROVADO' | 'REJEITADO';
  motivo?: string;
};

/** Decisões de quem gerencia as horas: aprovar e rejeitar em lote e reabrir o aprovado. */
@Injectable()
export class ProjetoApontamentoAprovacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoApontamentoAuthorizationService,
    private readonly consultas: ProjetoHorasQueryService,
    private readonly periodos: ProjetoApontamentoPeriodoService,
    private readonly custos: ProjetoApontamentoCustoService,
    private readonly idempotencia: ProjetoIdempotenciaService,
    private readonly auditoria: ProjetoAuditoriaService
  ) {}

  /** Aprova o lote inteiro ou nenhum apontamento, congelando o custo de cada um pela taxa do dia do trabalho. */
  aprovar(input: AprovarProjetoApontamentosInput, user: JwtPayload): Promise<ProjetoHorasApontamentoType[]> {
    return this.decidir(input, user, {
      operacao: ProjetoApontamentoOperacao.APROVAR,
      idempotencia: 'APROVAR_APONTAMENTOS',
      evento: 'APROVADO'
    });
  }

  /** Rejeita o lote inteiro ou nenhum apontamento, com o motivo que o autor verá. */
  rejeitar(input: RejeitarProjetoApontamentosInput, user: JwtPayload): Promise<ProjetoHorasApontamentoType[]> {
    return this.decidir(input, user, {
      operacao: ProjetoApontamentoOperacao.REJEITAR,
      idempotencia: 'REJEITAR_APONTAMENTOS',
      evento: 'REJEITADO',
      motivo: input.motivo
    });
  }

  /** Devolve o aprovado para rascunho, com motivo, e remove o custo; a nova aprovação calcula outra vez. */
  async reabrir(input: ReabrirProjetoApontamentoInput, user: JwtPayload): Promise<ProjetoHorasApontamentoType> {
    const empresaId = await this.authorization.assertAcaoNasHoras(user, ProjetoAcao.REABRIR_HORAS);
    const contexto = await this.authorization.projetoDasHoras(input.projetoId, user, empresaId);
    this.authorization.assertProjetoGravavel(contexto);
    const motivo = normalizeMotivoApontamento(input.motivo);
    const escopo = await this.authorization.escopoDasHoras(user, contexto);

    await this.emTransacao(async (tx) => {
      const encontrar = await this.doEscopo(tx, [input.id], contexto, escopo);
      const atual = encontrar(input);
      const emCompetenciaFechada = await this.periodos.emCompetenciaFechada([atual.apontamento], tx);
      const status = this.transicionar(ProjetoApontamentoOperacao.REABRIR, atual.apontamento, user, contexto, emCompetenciaFechada.size > 0);

      await this.atualizarVersao(tx, atual.apontamento.id, atual.versao, { status, motivo, ...PROJETO_APONTAMENTO_SEM_CUSTO });
      await this.registrar(tx, contexto, user, atual.apontamento.id, 'REABERTO', {
        statusAnterior: atual.apontamento.status,
        motivo,
        custoRemovido: this.custoGravado(atual.apontamento)
      });
    });

    const [apontamento] = await this.consultas.doProjeto([input.id], user, contexto);
    if (!apontamento) {
      throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
    }

    return apontamento;
  }

  private async decidir(
    input: AprovarProjetoApontamentosInput,
    user: JwtPayload,
    decisao: Decisao
  ): Promise<ProjetoHorasApontamentoType[]> {
    const empresaId = await this.authorization.assertAcaoNasHoras(user, ProjetoAcao.APROVAR_HORAS);
    const contexto = await this.authorization.projetoDasHoras(input.projetoId, user, empresaId);
    this.authorization.assertProjetoGravavel(contexto);
    const motivo = decisao.motivo === undefined ? null : normalizeMotivoApontamento(decisao.motivo);
    const escopo = await this.authorization.escopoDasHoras(user, contexto);
    const ids = input.apontamentos.map((apontamento) => apontamento.id);

    const decididos = await this.emTransacao(async (tx) => {
      const operacao = await this.idempotencia.iniciar(tx, {
        empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        operacao: decisao.idempotencia,
        chave: input.chaveIdempotencia
      }, { apontamentos: [...input.apontamentos].sort((a, b) => a.id.localeCompare(b.id)), motivo });
      if (operacao.reutilizada) {
        return idsDaResposta(operacao.resposta);
      }

      const encontrar = await this.doEscopo(tx, ids, contexto, escopo);
      const pedidos = input.apontamentos.map((pedido) => encontrar(pedido));
      const apontamentos = pedidos.map((pedido) => pedido.apontamento);
      const emCompetenciaFechada = await this.periodos.emCompetenciaFechada(apontamentos, tx);
      const custoDe = decisao.operacao === ProjetoApontamentoOperacao.APROVAR
        ? await this.custos.calculadora(apontamentos, { empresaId, projetoId: contexto.projeto.id }, tx)
        : null;
      const decididoEm = new Date();

      for (const { apontamento, versao } of pedidos) {
        const status = this.transicionar(decisao.operacao, apontamento, user, contexto, emCompetenciaFechada.has(apontamento));
        const custo = custoDe ? custoDe(apontamento) : null;

        await this.atualizarVersao(tx, apontamento.id, versao, {
          status,
          decididoPorId: user.sub,
          decididoEm,
          ...(motivo ? { motivo } : {}),
          ...(custo ?? {})
        });
        await this.registrar(tx, contexto, user, apontamento.id, decisao.evento, {
          statusAnterior: apontamento.status,
          ...(motivo ? { motivo } : {}),
          ...(custo ? { custo } : {})
        });
      }

      await this.idempotencia.concluir(tx, operacao.id, { apontamentos: ids });
      return ids;
    });

    return this.consultas.doProjeto(decididos, user, contexto);
  }

  /**
   * Lê os apontamentos pedidos no escopo de quem decide e devolve quem encontra cada pedido com a versão informada;
   * o pedido fora do escopo, de outro projeto ou inexistente responde como não encontrado.
   */
  private async doEscopo(
    tx: Prisma.TransactionClient,
    ids: readonly string[],
    contexto: ProjetoApontamentoContexto,
    escopo: ProjetoApontamentoEscopo
  ): Promise<(pedido: VersionarProjetoApontamentoInput) => { apontamento: ProjetoApontamentoRecord; versao: number }> {
    const encontrados = await tx.projetoApontamento.findMany({
      where: {
        id: { in: [...ids] },
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        ...this.authorization.filtroDoEscopo(escopo)
      }
    });
    const porId = new Map(encontrados.map((apontamento) => [apontamento.id, apontamento]));

    return ({ id, versao }) => {
      const apontamento = porId.get(id);
      if (!apontamento) {
        throw new NotFoundException(APONTAMENTO_NAO_ENCONTRADO);
      }
      return { apontamento, versao };
    };
  }

  private transicionar(
    operacao: ProjetoApontamentoOperacao.APROVAR | ProjetoApontamentoOperacao.REJEITAR | ProjetoApontamentoOperacao.REABRIR,
    apontamento: ProjetoApontamentoRecord,
    user: JwtPayload,
    contexto: ProjetoApontamentoContexto,
    competenciaFechada: boolean
  ): ProjetoApontamentoStatus {
    return resolveProjetoApontamentoTransicao({
      operacao,
      status: apontamento.status as ProjetoApontamentoStatus,
      descartado: !!apontamento.arquivadoEm,
      atorEhAutor: apontamento.usuarioId === user.sub,
      situacaoProjeto: contexto.projeto.situacao as ProjetoSituacao,
      competenciaFechada,
      competencia: this.periodos.competencia(apontamento)
    });
  }

  private async atualizarVersao(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: Prisma.ProjetoApontamentoUncheckedUpdateManyInput
  ): Promise<void> {
    const { count } = await tx.projetoApontamento.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } }
    });
    if (count !== 1) {
      throw new ConflictException(VERSAO_DESATUALIZADA);
    }
  }

  /** O custo que a reabertura remove, no mesmo formato em que a aprovação o registrou. */
  private custoGravado(apontamento: ProjetoApontamentoRecord): ProjetoApontamentoCusto {
    return {
      custoSituacao: (apontamento.custoSituacao ?? ProjetoApontamentoCustoSituacao.NAO_APLICAVEL) as ProjetoApontamentoCustoSituacao,
      custoId: apontamento.custoId ?? null,
      taxaHistoricoId: apontamento.taxaHistoricoId ?? null,
      taxaHoraAplicada: formatarDecimal(apontamento.taxaHoraAplicada, 4),
      valorCusto: formatarDecimal(apontamento.valorCusto, 2),
      moeda: apontamento.moeda ?? null
    };
  }

  private registrar(
    tx: Prisma.TransactionClient,
    contexto: ProjetoApontamentoContexto,
    user: JwtPayload,
    apontamentoId: string,
    evento: string,
    dados: unknown
  ): Promise<unknown> {
    return this.auditoria.registrar(tx, {
      empresaId: contexto.empresaId,
      projetoId: contexto.projeto.id,
      usuarioId: user.sub,
      entidade: 'APONTAMENTO',
      entidadeId: apontamentoId,
      evento,
      dados
    });
  }

  /** Serializável: a competência, a versão e o custo de cada apontamento do lote são lidos e gravados sem corrida. */
  private emTransacao<T>(operacao: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return runSerializableTransaction(
      this.prisma,
      operacao,
      'Outra operação alterou os apontamentos deste projeto ao mesmo tempo. Atualize os dados e tente de novo.'
    );
  }
}

/** A resposta guardada pela chave de idempotência: os apontamentos decididos na primeira execução. */
function idsDaResposta(resposta: unknown): string[] {
  const apontamentos = typeof resposta === 'object' && resposta !== null && 'apontamentos' in resposta
    ? resposta.apontamentos
    : null;

  return Array.isArray(apontamentos) ? apontamentos.filter((id): id is string => typeof id === 'string') : [];
}
