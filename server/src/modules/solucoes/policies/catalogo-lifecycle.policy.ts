import { ConflictException } from '@nestjs/common';
import { CatalogoValidationIssue, CatalogoVersionState, ThreeWayMergeResult } from '../types/catalogo-lifecycle.types';

const ALLOWED_TRANSITIONS: Record<CatalogoVersionState, CatalogoVersionState[]> = {
  RASCUNHO: ['PUBLICADA', 'DESCARTADA'],
  PUBLICADA: ['SUBSTITUIDA'],
  SUBSTITUIDA: [],
  DESCARTADA: []
};

export function assertCatalogoVersionTransition(current: CatalogoVersionState, target: CatalogoVersionState): void {
  if (!ALLOWED_TRANSITIONS[current].includes(target)) {
    throw new ConflictException(`Transicao de versao do catalogo invalida: ${current} -> ${target}.`);
  }
}

export function assertCatalogoRevision(expected: number, current: number): void {
  if (expected !== current) {
    throw new ConflictException('O rascunho foi alterado por outro usuario. Recarregue os dados antes de continuar.');
  }
}

export function mergeCatalogoField<T>(baselineAnterior: T, valorEfetivo: T, baselineNovo: T): ThreeWayMergeResult<T> {
  if (Object.is(valorEfetivo, baselineAnterior)) {
    return { value: baselineNovo, conflict: false };
  }

  if (Object.is(baselineNovo, baselineAnterior) || Object.is(valorEfetivo, baselineNovo)) {
    return { value: valorEfetivo, conflict: false };
  }

  return { value: valorEfetivo, conflict: true };
}

export function publicationBlocked(issues: CatalogoValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'ERROR');
}
