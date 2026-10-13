import { Prisma } from '@prisma/client';
import { ProjetoApontamentoCustoSituacao } from '../types/projeto-apontamento.types';

export type ProjetoApontamentoTaxaRegistro = {
  id: string;
  taxaHora: Prisma.Decimal.Value;
  criadoEm: Date;
};

export type ProjetoApontamentoLinhaCusto = {
  id: string;
  itemId: string | null;
  taxaHora: Prisma.Decimal.Value | null;
  taxas: readonly ProjetoApontamentoTaxaRegistro[];
};

export type ProjetoApontamentoTaxaEscolhida =
  | {
      situacao: ProjetoApontamentoCustoSituacao.CALCULADO;
      custoId: string;
      taxaHistoricoId: string | null;
      taxaHora: string;
    }
  | { situacao: ProjetoApontamentoCustoSituacao.SEM_TAXA | ProjetoApontamentoCustoSituacao.TAXA_AMBIGUA };

/**
 * Escolhe, entre as linhas de custo do tipo recurso do vínculo da pessoa com o projeto, a do item do
 * apontamento ou, sem ela, a linha geral. Na linha escolhida vale o último registro de taxa criado antes de
 * `fimDoDiaTrabalho`, instante exclusivo que marca a meia-noite seguinte no fuso operacional. Trabalho anterior
 * ao primeiro registro usa o primeiro; linha sem histórico usa a taxa atual dela.
 */
export function escolherTaxaApontamento(
  linhas: readonly ProjetoApontamentoLinhaCusto[],
  itemId: string | null,
  fimDoDiaTrabalho: Date
): ProjetoApontamentoTaxaEscolhida {
  const linhasDoItem = itemId ? linhas.filter((linha) => linha.itemId === itemId) : [];
  const candidatas = linhasDoItem.length > 0 ? linhasDoItem : linhas.filter((linha) => !linha.itemId);

  const [linha, ...outras] = candidatas;

  if (!linha) return { situacao: ProjetoApontamentoCustoSituacao.SEM_TAXA };
  if (outras.length > 0) return { situacao: ProjetoApontamentoCustoSituacao.TAXA_AMBIGUA };

  const registro = taxaVigente(linha.taxas, fimDoDiaTrabalho);

  if (registro) {
    return {
      situacao: ProjetoApontamentoCustoSituacao.CALCULADO,
      custoId: linha.id,
      taxaHistoricoId: registro.id,
      taxaHora: new Prisma.Decimal(registro.taxaHora).toFixed(4)
    };
  }

  if (linha.taxaHora === null) return { situacao: ProjetoApontamentoCustoSituacao.SEM_TAXA };

  return {
    situacao: ProjetoApontamentoCustoSituacao.CALCULADO,
    custoId: linha.id,
    taxaHistoricoId: null,
    taxaHora: new Prisma.Decimal(linha.taxaHora).toFixed(4)
  };
}

function taxaVigente(
  taxas: readonly ProjetoApontamentoTaxaRegistro[],
  fimDoDiaTrabalho: Date
): ProjetoApontamentoTaxaRegistro | null {
  const ordenadas = [...taxas].sort(
    (a, b) => a.criadoEm.getTime() - b.criadoEm.getTime() || a.id.localeCompare(b.id)
  );
  const anteriores = ordenadas.filter((taxa) => taxa.criadoEm.getTime() < fimDoDiaTrabalho.getTime());

  return anteriores[anteriores.length - 1] ?? ordenadas[0] ?? null;
}
