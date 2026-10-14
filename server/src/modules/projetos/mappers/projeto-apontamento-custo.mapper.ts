import { Prisma } from '@prisma/client';
import { ProjetoApontamentoCustoSituacao } from '../types/projeto-apontamento.types';

export type ProjetoApontamentoAprovado = {
  custoId?: string | null;
  minutos: number;
  valorCusto?: Prisma.Decimal.Value | null;
  custoSituacao?: string;
};

export type ProjetoCustoDasHoras = { minutos: number; valor: Prisma.Decimal };

export type ProjetoResumoDoCustoDasHoras = {
  porCusto: ReadonlyMap<string, ProjetoCustoDasHoras>;
  total: Prisma.Decimal;
  semCusto: number;
};

const SITUACOES_SEM_CUSTO: ReadonlySet<string> = new Set([
  ProjetoApontamentoCustoSituacao.SEM_TAXA,
  ProjetoApontamentoCustoSituacao.TAXA_AMBIGUA
]);

/**
 * Soma os minutos e o custo congelado dos apontamentos aprovados por linha de custo. Os totais somam valores já
 * arredondados em cada apontamento; os aprovados sem taxa ou com taxa ambígua são apenas contados.
 */
export function resumirCustoDasHoras(aprovados: readonly ProjetoApontamentoAprovado[]): ProjetoResumoDoCustoDasHoras {
  const porCusto = new Map<string, ProjetoCustoDasHoras>();
  let total = new Prisma.Decimal(0);
  let semCusto = 0;

  for (const apontamento of aprovados) {
    if (apontamento.custoSituacao && SITUACOES_SEM_CUSTO.has(apontamento.custoSituacao)) {
      semCusto += 1;
      continue;
    }
    if (!apontamento.custoId || apontamento.valorCusto === null || apontamento.valorCusto === undefined) {
      continue;
    }

    const valor = new Prisma.Decimal(apontamento.valorCusto);
    const linha = custoDaLinha({ porCusto, total, semCusto }, apontamento.custoId);
    porCusto.set(apontamento.custoId, { minutos: linha.minutos + apontamento.minutos, valor: linha.valor.add(valor) });
    total = total.add(valor);
  }

  return { porCusto, total, semCusto };
}

/** Minutos e custo das horas aprovadas ligadas à linha; zero quando nenhuma hora aprovada usa a linha. */
export function custoDaLinha(resumo: ProjetoResumoDoCustoDasHoras, custoId: string): ProjetoCustoDasHoras {
  return resumo.porCusto.get(custoId) ?? { minutos: 0, valor: new Prisma.Decimal(0) };
}
