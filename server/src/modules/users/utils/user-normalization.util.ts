import { FormFieldBadRequestException } from '../../../common/exceptions/form-field.exception';

export const LOGIN_MAX_LENGTH = 100;

export function normalizeEmpresaIds(empresaIds?: number[] | null): number[] {
  if (!empresaIds?.length) {
    return [];
  }

  return [...new Set(empresaIds.filter((empresaId) => Number.isInteger(empresaId) && empresaId > 0))];
}

export function normalizeLogin(login?: string | null): string | null {
  const normalized = login?.toLowerCase().trim();

  if (normalized?.includes('@')) {
    throw new FormFieldBadRequestException('login', 'Login nao pode conter @.');
  }

  if (normalized && normalized.length > LOGIN_MAX_LENGTH) {
    throw new FormFieldBadRequestException('login', `Login deve ter no maximo ${LOGIN_MAX_LENGTH} caracteres.`);
  }

  return normalized || null;
}
