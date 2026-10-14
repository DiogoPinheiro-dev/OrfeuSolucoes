import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { runSerializableTransaction } from '../../common/persistence/serializable-transaction.util';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { RecalcularCustoProjetoApontamentosInput } from './dto/projeto-horas.input';
import { ProjetoApontamentoRecalculoType } from './dto/projeto-horas.type';
import { escolherTaxaApontamento, ProjetoApontamentoLinhaCusto } from './policies/projeto-apontamento-taxa.policy';
import { calcularValorPorMinutos } from './policies/projeto-dinheiro.policy';
import { formatCalendarDate } from './policies/projeto-input.policy';
import { ProjetoApontamentoAuthorizationService } from './projeto-apontamento-authorization.service';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import {
  PROJETO_APONTAMENTO_SEM_CUSTO,
  ProjetoApontamentoCusto,
  ProjetoApontamentoCustoSituacao,
  ProjetoApontamentoRecord,
  ProjetoApontamentoStatus
} from './types/projeto-apontamento.types';
import { ProjetoCustoTipo } from './types/projeto-orcamento.types';

/** O que o cálculo precisa saber de cada apontamento. */
export type ProjetoApontamentoParaCusto = Pick<ProjetoApontamentoRecord, 'usuarioId' | 'itemId' | 'dataTrabalho' | 'minutos'>;

export type ProjetoApontamentoCalculadoraDeCusto = (apontamento: ProjetoApontamentoParaCusto) => ProjetoApontamentoCusto;

type CustoClient = Pick<Prisma.TransactionClient, 'projetoOrcamento' | 'recurso' | 'projetoRecurso' | 'projetoCusto'>;

const PENDENTES = [ProjetoApontamentoCustoSituacao.SEM_TAXA, ProjetoApontamentoCustoSituacao.TAXA_AMBIGUA];

@Injectable()
export class ProjetoApontamentoCustoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoApontamentoAuthorizationService,
    private readonly periodo: ProjetoPeriodoService,
    private readonly auditoria: ProjetoAuditoriaService
  ) {}

  /**
   * Carrega, numa leitura por tabela, as linhas de custo de recurso dos autores e devolve quem calcula o custo de cada
   * apontamento: o recurso da pessoa na empresa, o vínculo dele com o projeto (ainda que inativo hoje) e, nesse
   * vínculo, a linha do item do apontamento ou a geral, com a taxa vigente no fim do dia do trabalho.
   */
  async calculadora(
    apontamentos: readonly ProjetoApontamentoParaCusto[],
    contexto: { empresaId: number; projetoId: string },
    db: CustoClient
  ): Promise<ProjetoApontamentoCalculadoraDeCusto> {
    const autores = [...new Set(apontamentos.map((apontamento) => apontamento.usuarioId))];
    const [orcamento, recursos] = await Promise.all([
      db.projetoOrcamento.findUnique({ where: { projetoId: contexto.projetoId }, select: { id: true, moeda: true } }),
      autores.length
        ? db.recurso.findMany({ where: { empresaId: contexto.empresaId, usuarioId: { in: autores } }, select: { id: true, usuarioId: true } })
        : Promise.resolve([])
    ]);
    const vinculos = orcamento && recursos.length
      ? await db.projetoRecurso.findMany({
          where: { projetoId: contexto.projetoId, recursoId: { in: recursos.map((recurso) => recurso.id) } },
          select: { id: true, recursoId: true }
        })
      : [];
    const linhas = orcamento && vinculos.length
      ? await db.projetoCusto.findMany({
          where: {
            projetoId: contexto.projetoId,
            orcamentoId: orcamento.id,
            tipo: ProjetoCustoTipo.RECURSO,
            recursoId: { in: vinculos.map((vinculo) => vinculo.id) }
          },
          select: { id: true, recursoId: true, itemId: true, taxaHora: true, taxas: { select: { id: true, taxaHora: true, criadoEm: true } } }
        })
      : [];
    const linhasDoAutor = new Map(recursos.map((recurso) => {
      const vinculoIds = new Set(vinculos.filter((vinculo) => vinculo.recursoId === recurso.id).map((vinculo) => vinculo.id));
      return [recurso.usuarioId, linhas.filter((linha) => linha.recursoId !== null && vinculoIds.has(linha.recursoId))];
    }));

    return (apontamento) => this.custoDoApontamento(apontamento, linhasDoAutor.get(apontamento.usuarioId) ?? [], orcamento?.moeda ?? null);
  }

  /**
   * Recalcula só os aprovados sem taxa ou com taxa ambígua; custos já calculados nunca mudam por aqui. Repetir a
   * operação sem mudar o orçamento não altera nada, e cada apontamento alterado fica na auditoria.
   */
  async recalcular(input: RecalcularCustoProjetoApontamentosInput, user: JwtPayload): Promise<ProjetoApontamentoRecalculoType> {
    const contexto = await this.authorization.contextoFinanceiro(input.projetoId, user);
    const escopo = { empresaId: contexto.empresaId, projetoId: contexto.projeto.id };

    return runSerializableTransaction(this.prisma, async (tx) => {
      const pendentes = await tx.projetoApontamento.findMany({
        where: { ...escopo, status: ProjetoApontamentoStatus.APROVADO, custoSituacao: { in: PENDENTES } }
      });
      const custoDe = await this.calculadora(pendentes, escopo, tx);
      let calculados = 0;

      for (const pendente of pendentes) {
        const custo = custoDe(pendente);
        if (custo.custoSituacao === pendente.custoSituacao) {
          continue;
        }

        const { count } = await tx.projetoApontamento.updateMany({
          where: { id: pendente.id, versao: pendente.versao, status: ProjetoApontamentoStatus.APROVADO, custoSituacao: pendente.custoSituacao },
          data: { ...custo, versao: { increment: 1 } }
        });
        if (count !== 1) {
          throw new ConflictException('O apontamento foi alterado em outra tela ou por outra pessoa. Atualize os dados.');
        }
        await this.auditoria.registrar(tx, {
          ...escopo,
          usuarioId: user.sub,
          entidade: 'APONTAMENTO',
          entidadeId: pendente.id,
          evento: 'CUSTO_RECALCULADO',
          dados: { antes: { custoSituacao: pendente.custoSituacao }, depois: custo }
        });
        if (custo.custoSituacao === ProjetoApontamentoCustoSituacao.CALCULADO) {
          calculados += 1;
        }
      }

      return { calculados, pendentes: pendentes.length - calculados };
    }, 'Outra operação alterou os apontamentos ou o orçamento deste projeto ao mesmo tempo. Atualize os dados e tente de novo.');
  }

  private custoDoApontamento(
    apontamento: ProjetoApontamentoParaCusto,
    linhas: readonly ProjetoApontamentoLinhaCusto[],
    moeda: string | null
  ): ProjetoApontamentoCusto {
    const fimDoDia = this.periodo.fimDoDiaOperacional(formatCalendarDate(apontamento.dataTrabalho));
    const escolhida = escolherTaxaApontamento(linhas, apontamento.itemId ?? null, fimDoDia);

    if (escolhida.situacao !== ProjetoApontamentoCustoSituacao.CALCULADO) {
      return { ...PROJETO_APONTAMENTO_SEM_CUSTO, custoSituacao: escolhida.situacao };
    }

    return {
      custoSituacao: ProjetoApontamentoCustoSituacao.CALCULADO,
      custoId: escolhida.custoId,
      taxaHistoricoId: escolhida.taxaHistoricoId,
      taxaHoraAplicada: escolhida.taxaHora,
      valorCusto: calcularValorPorMinutos(apontamento.minutos, escolhida.taxaHora),
      moeda
    };
  }
}
