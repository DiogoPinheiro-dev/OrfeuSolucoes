import { Prisma } from '@prisma/client';
import { ProjetoApontamentoItemType } from '../dto/projeto-apontamento.type';
import {
  ProjetoApontamentoCustoType,
  ProjetoHorasAcoesType,
  ProjetoHorasApontamentoType,
  ProjetoHorasCustoItemType,
  ProjetoHorasCustoUsuarioType,
  ProjetoHorasLinhaCustoType,
  ProjetoHorasTotalItemType,
  ProjetoHorasTotalUsuarioType
} from '../dto/projeto-horas.type';
import { ProjetoUsuarioType } from '../dto/projeto.type';
import { formatarDecimal } from '../policies/projeto-dinheiro.policy';
import {
  ProjetoApontamentoCustoSituacao,
  ProjetoApontamentoRecord,
  ProjetoApontamentoStatus,
  ProjetoHorasApontamentoRecord
} from '../types/projeto-apontamento.types';
import { ProjetoUsuarioRecord } from '../types/projeto.types';
import { ProjetoCustoDasHoras } from './projeto-apontamento-custo.mapper';
import { camposDoApontamento } from './projeto-apontamento.mapper';
import { toProjetoUsuarioType } from './projeto.mapper';

type ItemDoApontamento = { id: string; chave: string; titulo: string };

/** Apontamento do período consultado, com o autor e o item, para os totais de Horas do projeto. */
export type ProjetoApontamentoLancado = Pick<
  ProjetoApontamentoRecord,
  'usuarioId' | 'itemId' | 'minutos' | 'status' | 'custoSituacao' | 'valorCusto'
> & {
  usuario: ProjetoUsuarioRecord;
  item?: ItemDoApontamento | null;
};

/** Linha de custo de recurso do orçamento, com a pessoa do vínculo. */
export type ProjetoHorasLinhaCustoRecord = {
  id: string;
  descricao: string;
  quantidadeMinutos?: number | null;
  taxaHora?: Prisma.Decimal.Value | null;
  valorPlanejado: Prisma.Decimal.Value;
  item?: ItemDoApontamento | null;
  recurso?: { cadastro: { usuario: ProjetoUsuarioRecord } } | null;
};

export function toProjetoHorasApontamentoType(
  apontamento: ProjetoHorasApontamentoRecord,
  competencia: string,
  acoes: ProjetoHorasAcoesType,
  custo: ProjetoApontamentoCustoType | null
): ProjetoHorasApontamentoType {
  return {
    ...camposDoApontamento(apontamento, competencia),
    usuario: toProjetoUsuarioType(apontamento.usuario),
    acoes,
    custo
  };
}

export function toProjetoApontamentoCustoType(
  apontamento: Pick<ProjetoApontamentoRecord, 'custoSituacao' | 'custoId' | 'taxaHoraAplicada' | 'valorCusto' | 'moeda'>
): ProjetoApontamentoCustoType {
  return {
    situacao: (apontamento.custoSituacao ?? ProjetoApontamentoCustoSituacao.NAO_APLICAVEL) as ProjetoApontamentoCustoSituacao,
    custoId: apontamento.custoId ?? null,
    taxaHoraAplicada: formatarDecimal(apontamento.taxaHoraAplicada, 4),
    valorCusto: formatarDecimal(apontamento.valorCusto, 2),
    moeda: apontamento.moeda ?? null
  };
}

/** Minutos do período por pessoa e por item, com os apontamentos sem item reunidos no fim. */
export function totalizarHorasDoProjeto(lancados: readonly ProjetoApontamentoLancado[]): {
  totalMinutos: number;
  totaisPorUsuario: ProjetoHorasTotalUsuarioType[];
  totaisPorItem: ProjetoHorasTotalItemType[];
} {
  return {
    totalMinutos: lancados.reduce((total, apontamento) => total + apontamento.minutos, 0),
    totaisPorUsuario: porUsuario(lancados).map(({ usuario, apontamentos }) => ({ usuario, minutos: somarMinutos(apontamentos) })),
    totaisPorItem: porItem(lancados).map(({ item, apontamentos }) => ({ item, minutos: somarMinutos(apontamentos) }))
  };
}

/** Custo congelado das horas aprovadas do período, por pessoa e por item; os totais somam valores já arredondados. */
export function totalizarCustoDasHoras(lancados: readonly ProjetoApontamentoLancado[]): {
  totalCusto: string;
  custosPorUsuario: ProjetoHorasCustoUsuarioType[];
  custosPorItem: ProjetoHorasCustoItemType[];
} {
  const calculados = lancados.filter((apontamento) =>
    apontamento.status === ProjetoApontamentoStatus.APROVADO &&
    apontamento.custoSituacao === ProjetoApontamentoCustoSituacao.CALCULADO &&
    apontamento.valorCusto !== null &&
    apontamento.valorCusto !== undefined
  );

  return {
    totalCusto: somarCusto(calculados).toFixed(2),
    custosPorUsuario: porUsuario(calculados).map(({ usuario, apontamentos }) => ({
      usuario,
      minutos: somarMinutos(apontamentos),
      valor: somarCusto(apontamentos).toFixed(2)
    })),
    custosPorItem: porItem(calculados).map(({ item, apontamentos }) => ({
      item,
      minutos: somarMinutos(apontamentos),
      valor: somarCusto(apontamentos).toFixed(2)
    }))
  };
}

export function toProjetoHorasLinhaCustoType(linha: ProjetoHorasLinhaCustoRecord, horas: ProjetoCustoDasHoras): ProjetoHorasLinhaCustoType {
  return {
    custoId: linha.id,
    descricao: linha.descricao,
    usuario: linha.recurso ? toProjetoUsuarioType(linha.recurso.cadastro.usuario) : null,
    item: linha.item ? { id: linha.item.id, chave: linha.item.chave, titulo: linha.item.titulo } : null,
    quantidadeMinutos: linha.quantidadeMinutos ?? null,
    taxaHora: formatarDecimal(linha.taxaHora, 4),
    valorPlanejado: new Prisma.Decimal(linha.valorPlanejado).toFixed(2),
    minutosAprovados: horas.minutos,
    valorRealizadoHoras: horas.valor.toFixed(2)
  };
}

function porUsuario(lancados: readonly ProjetoApontamentoLancado[]): Array<{ usuario: ProjetoUsuarioType; apontamentos: ProjetoApontamentoLancado[] }> {
  const grupos = new Map<string, { usuario: ProjetoUsuarioType; apontamentos: ProjetoApontamentoLancado[] }>();

  for (const apontamento of lancados) {
    const grupo = grupos.get(apontamento.usuarioId) ?? { usuario: toProjetoUsuarioType(apontamento.usuario), apontamentos: [] };
    grupo.apontamentos.push(apontamento);
    grupos.set(apontamento.usuarioId, grupo);
  }

  return [...grupos.values()].sort((grupoA, grupoB) =>
    nomeDe(grupoA.usuario).localeCompare(nomeDe(grupoB.usuario)) || grupoA.usuario.id.localeCompare(grupoB.usuario.id)
  );
}

function porItem(lancados: readonly ProjetoApontamentoLancado[]): Array<{ item: ProjetoApontamentoItemType | null; apontamentos: ProjetoApontamentoLancado[] }> {
  const grupos = new Map<string | null, { item: ProjetoApontamentoItemType | null; apontamentos: ProjetoApontamentoLancado[] }>();

  for (const apontamento of lancados) {
    const item = apontamento.item ? { id: apontamento.item.id, chave: apontamento.item.chave, titulo: apontamento.item.titulo } : null;
    const grupo = grupos.get(item?.id ?? null) ?? { item, apontamentos: [] };
    grupo.apontamentos.push(apontamento);
    grupos.set(item?.id ?? null, grupo);
  }

  return [...grupos.values()].sort((grupoA, grupoB) => {
    if (!grupoA.item || !grupoB.item) return Number(!grupoA.item) - Number(!grupoB.item);
    return grupoA.item.chave.localeCompare(grupoB.item.chave, undefined, { numeric: true });
  });
}

function nomeDe(usuario: ProjetoUsuarioType): string {
  return usuario.nome ?? usuario.login ?? usuario.email;
}

function somarMinutos(apontamentos: readonly ProjetoApontamentoLancado[]): number {
  return apontamentos.reduce((total, apontamento) => total + apontamento.minutos, 0);
}

function somarCusto(apontamentos: readonly ProjetoApontamentoLancado[]): Prisma.Decimal {
  return apontamentos.reduce(
    (total, apontamento) => total.add(new Prisma.Decimal(apontamento.valorCusto ?? 0)),
    new Prisma.Decimal(0)
  );
}
