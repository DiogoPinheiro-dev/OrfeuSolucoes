import { BadRequestException } from '@nestjs/common';
import { CLOSED_STATUSES, GENERAL_STATUS_TRANSITIONS, TERMINAL_STATUSES } from '../constants/chamado.constants';

export function isTerminalStatus(status?: string | null): boolean {
  return TERMINAL_STATUSES.includes(status as never);
}

export function isClosedStatus(status?: string | null): boolean {
  return CLOSED_STATUSES.includes(status as never);
}

export function assertStatusTransition(current: string, next: string): void {
  if (current === next) {
    return;
  }

  const allowed = GENERAL_STATUS_TRANSITIONS[current] ?? [];

  if (!allowed.includes(next)) {
    throw new BadRequestException(`Transicao de status invalida: ${current} -> ${next}.`);
  }
}
