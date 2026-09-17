import { ProjetoItemPrioridade, ProjetoItemStatus, ProjetoItemTipo } from '../types/projeto-item.types';

export enum ProjetoBacklogAgrupamento {
  STATUS = 'STATUS',
  TIPO = 'TIPO',
  PRIORIDADE = 'PRIORIDADE'
}

type CampoAgrupamento = 'status' | 'tipo' | 'prioridade';
export type ItemAgrupavel = { id: string; status: string; tipo: string; prioridade: string };
export type GrupoDoBacklog = { valor: string; total: number };

const CAMPOS: Record<ProjetoBacklogAgrupamento, CampoAgrupamento> = {
  [ProjetoBacklogAgrupamento.STATUS]: 'status',
  [ProjetoBacklogAgrupamento.TIPO]: 'tipo',
  [ProjetoBacklogAgrupamento.PRIORIDADE]: 'prioridade'
};

/** Ordem de apresentação: fluxo de trabalho, natureza da demanda e urgência. */
const ORDEM_DOS_GRUPOS: Record<ProjetoBacklogAgrupamento, string[]> = {
  [ProjetoBacklogAgrupamento.STATUS]: [ProjetoItemStatus.ABERTO, ProjetoItemStatus.EM_ANDAMENTO, ProjetoItemStatus.CONCLUIDO, ProjetoItemStatus.CANCELADO],
  [ProjetoBacklogAgrupamento.TIPO]: [ProjetoItemTipo.HISTORIA, ProjetoItemTipo.TAREFA, ProjetoItemTipo.BUG, ProjetoItemTipo.MELHORIA],
  [ProjetoBacklogAgrupamento.PRIORIDADE]: [ProjetoItemPrioridade.CRITICA, ProjetoItemPrioridade.ALTA, ProjetoItemPrioridade.MEDIA, ProjetoItemPrioridade.BAIXA]
};

/**
 * Ordena toda a lista pelo grupo antes da paginação, preservando a ordem do backlog
 * dentro de cada grupo. Valores desconhecidos ficam ao final.
 */
export function ordenarPorAgrupamento<T extends ItemAgrupavel>(itens: T[], agrupamento: ProjetoBacklogAgrupamento): T[] {
  const campo = CAMPOS[agrupamento];
  const ordem = ORDEM_DOS_GRUPOS[agrupamento];
  const posicao = (valor: string) => {
    const index = ordem.indexOf(valor);
    return index < 0 ? ordem.length : index;
  };

  return itens
    .map((item, index) => ({ item, index }))
    .sort((left, right) => posicao(left.item[campo]) - posicao(right.item[campo]) || left.index - right.index)
    .map(({ item }) => item);
}

/** Totais de cada grupo sobre a lista completa, na mesma ordem de apresentação. */
export function contarGrupos<T extends ItemAgrupavel>(itensOrdenados: T[], agrupamento: ProjetoBacklogAgrupamento): GrupoDoBacklog[] {
  const campo = CAMPOS[agrupamento];
  const grupos: GrupoDoBacklog[] = [];

  for (const item of itensOrdenados) {
    const atual = grupos[grupos.length - 1];
    if (atual?.valor === item[campo]) {
      atual.total += 1;
    } else {
      grupos.push({ valor: item[campo], total: 1 });
    }
  }

  return grupos;
}
