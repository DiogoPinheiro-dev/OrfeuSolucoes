import { BadRequestException } from '@nestjs/common';
import { ProjetoItemStatus } from '../types/projeto-item.types';

const TRANSITIONS: Record<ProjetoItemStatus, ProjetoItemStatus[]> = {
  [ProjetoItemStatus.ABERTO]: [
    ProjetoItemStatus.EM_ANDAMENTO,
    ProjetoItemStatus.CONCLUIDO,
    ProjetoItemStatus.CANCELADO
  ],
  [ProjetoItemStatus.EM_ANDAMENTO]: [
    ProjetoItemStatus.ABERTO,
    ProjetoItemStatus.CONCLUIDO,
    ProjetoItemStatus.CANCELADO
  ],
  [ProjetoItemStatus.CONCLUIDO]: [ProjetoItemStatus.EM_ANDAMENTO],
  [ProjetoItemStatus.CANCELADO]: [ProjetoItemStatus.ABERTO]
};

export function assertProjetoItemStatusTransition(
  atual: ProjetoItemStatus,
  destino: ProjetoItemStatus
): void {
  if (atual === destino) return;

  if (!TRANSITIONS[atual]?.includes(destino)) {
    throw new BadRequestException(
      `Transicao de item invalida: ${atual} -> ${destino}.`
    );
  }
}
