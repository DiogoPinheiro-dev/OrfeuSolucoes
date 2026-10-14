import { BadRequestException } from '@nestjs/common';

export const PROJETO_APONTAMENTO_MINUTOS_POR_DIA = 1440;

export const PROJETO_APONTAMENTO_DESCRICAO_MAXIMA = 1000;

export const PROJETO_APONTAMENTO_MOTIVO_MINIMO = 5;

export const PROJETO_APONTAMENTO_MOTIVO_MAXIMO = 500;

export type ProjetoApontamentoDoDia = {
  id: string;
  minutos: number;
  arquivadoEm?: Date | null;
};

export function assertMinutosApontamento(minutos: number): number {
  if (!Number.isSafeInteger(minutos) || minutos < 1 || minutos > PROJETO_APONTAMENTO_MINUTOS_POR_DIA) {
    throw new BadRequestException('A duração do apontamento deve ser um número inteiro de minutos entre 1 e 1.440.');
  }

  return minutos;
}

export function normalizeDescricaoApontamento(descricao: string): string {
  const normalizada = (descricao ?? '').trim();

  if (!normalizada) {
    throw new BadRequestException('Informe a descrição do apontamento.');
  }

  if (normalizada.length > PROJETO_APONTAMENTO_DESCRICAO_MAXIMA) {
    throw new BadRequestException('A descrição do apontamento pode ter até 1.000 caracteres.');
  }

  return normalizada;
}

/** Motivo de rejeição, de reabertura de apontamento ou de reabertura de competência, visível para o autor. */
export function normalizeMotivoApontamento(motivo: string): string {
  const normalizado = (motivo ?? '').trim();

  if (normalizado.length < PROJETO_APONTAMENTO_MOTIVO_MINIMO || normalizado.length > PROJETO_APONTAMENTO_MOTIVO_MAXIMO) {
    throw new BadRequestException('Informe um motivo com 5 a 500 caracteres.');
  }

  return normalizado;
}

/**
 * Soma os apontamentos não descartados da pessoa no dia, em todos os projetos da empresa, sem contar o próprio
 * apontamento em edição, e bloqueia o que passar de 24 horas.
 */
export function assertLimiteDiarioApontamentos(
  apontamentosDoDia: readonly ProjetoApontamentoDoDia[],
  candidato: { id?: string | null; minutos: number }
): void {
  const jaLancados = apontamentosDoDia
    .filter((apontamento) => !apontamento.arquivadoEm && apontamento.id !== candidato.id)
    .reduce((total, apontamento) => total + apontamento.minutos, 0);

  if (jaLancados + candidato.minutos > PROJETO_APONTAMENTO_MINUTOS_POR_DIA) {
    const disponiveis = Math.max(0, PROJETO_APONTAMENTO_MINUTOS_POR_DIA - jaLancados);
    throw new BadRequestException(
      `O dia já tem ${formatarHoras(jaLancados)} lançadas e só cabem mais ${formatarHoras(disponiveis)}.`
    );
  }
}

function formatarHoras(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}
