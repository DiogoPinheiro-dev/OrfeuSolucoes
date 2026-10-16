import { ProjetoItemStatus } from '../types/projeto-item.types';

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export type ProjetoItemParaProgresso = {
  status: string;
  estimativaMinutos?: number | null;
  arquivadoEm?: Date | null;
};

export type ProjetoProgresso = {
  percentual: number;
  totalItens: number;
  itensConcluidos: number;
  estimativaTotalMinutos: number;
  estimativaConcluidaMinutos: number;
  usaEstimativas: boolean;
};

/**
 * Regra unica de progresso do projeto (D8 do Planejamento 19).
 * Itens cancelados e arquivados nao participam nem do numerador nem do denominador.
 */
export function calcularProjetoProgresso(
  itens: ProjetoItemParaProgresso[]
): ProjetoProgresso {
  const considerados = itens.filter(
    (item) => !item.arquivadoEm && item.status !== ProjetoItemStatus.CANCELADO
  );
  const estimativa = (item: ProjetoItemParaProgresso) =>
    Math.max(item.estimativaMinutos ?? 0, 0);
  const usaEstimativas = considerados.some((item) => estimativa(item) > 0);
  const concluidos = considerados.filter(
    (item) => item.status === ProjetoItemStatus.CONCLUIDO
  );
  const estimativaTotalMinutos = considerados.reduce(
    (total, item) => total + estimativa(item),
    0
  );
  const estimativaConcluidaMinutos = concluidos.reduce(
    (total, item) => total + estimativa(item),
    0
  );
  const denominador = usaEstimativas
    ? estimativaTotalMinutos
    : considerados.length;
  const numerador = usaEstimativas
    ? estimativaConcluidaMinutos
    : concluidos.length;

  return {
    percentual: denominador ? Math.round((numerador / denominador) * 100) : 0,
    totalItens: considerados.length,
    itensConcluidos: concluidos.length,
    estimativaTotalMinutos,
    estimativaConcluidaMinutos,
    usaEstimativas
  };
}

export function calcularProgressoEsperado(
  inicioPrevistoEm: Date | null | undefined,
  fimPrevistoEm: Date | null | undefined,
  hojeOperacional: string
): number | null {
  if (!inicioPrevistoEm || !fimPrevistoEm) return null;

  const inicio = inicioDoDiaUtc(inicioPrevistoEm);
  const fim = inicioDoDiaUtc(fimPrevistoEm);
  const hoje = dataOperacionalUtc(hojeOperacional);
  if (fim <= inicio) return hoje < inicio ? 0 : 100;

  const percentual = ((hoje - inicio) / (fim - inicio)) * 100;
  return Math.round(Math.max(0, Math.min(100, percentual)));
}

export function diasAteData(
  data: Date | null | undefined,
  hojeOperacional: string
): number | null {
  if (!data) return null;
  return Math.round(
    (inicioDoDiaUtc(data) - dataOperacionalUtc(hojeOperacional)) / UM_DIA_EM_MS
  );
}

export function estaVencidoNoDiaOperacional(
  data: Date | null | undefined,
  hojeOperacional: string
): boolean {
  const dias = diasAteData(data, hojeOperacional);
  return dias !== null && dias < 0;
}

function inicioDoDiaUtc(data: Date): number {
  return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

function dataOperacionalUtc(valor: string): number {
  const [ano, mes, dia] = valor.split('-').map(Number) as [number, number, number];
  return Date.UTC(ano, mes - 1, dia);
}
