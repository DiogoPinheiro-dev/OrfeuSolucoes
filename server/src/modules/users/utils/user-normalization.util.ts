export function normalizeEmpresaIds(empresaIds?: number[] | null): number[] {
  if (!empresaIds?.length) {
    return [];
  }

  return [...new Set(empresaIds.filter((empresaId) => Number.isInteger(empresaId) && empresaId > 0))];
}

export function normalizeLogin(login?: string | null): string | null {
  const normalized = login?.toLowerCase().trim();

  return normalized || null;
}
