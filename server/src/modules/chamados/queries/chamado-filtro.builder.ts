import { STATUS } from '../constants/chamado.constants';
import { ChamadoFiltroInput } from '../dto/chamado-filtro.input';

type NormalizeChamadoValue = (
  value: string | null | undefined,
  allowed: typeof STATUS,
  fallback: typeof STATUS[number] | undefined,
  fieldName: string
) => typeof STATUS[number];

export function buildChamadoWhere(
  empresaId: number,
  filtro: ChamadoFiltroInput | null | undefined,
  extraWhere: Record<string, unknown>,
  normalizeValue: NormalizeChamadoValue
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    empresaId,
    ...extraWhere
  };

  if (filtro?.status) {
    where.status = normalizeValue(filtro.status, STATUS, undefined, 'status');
  }

  if (filtro?.prioridadeId) {
    where.prioridadeId = filtro.prioridadeId;
  }

  if (filtro?.solicitanteId) {
    where.solicitanteId = filtro.solicitanteId;
  }

  if (filtro?.responsavelId) {
    where.responsavelId = filtro.responsavelId;
  }

  if (filtro?.responsavelGrupoId) {
    where.responsavelGrupoId = filtro.responsavelGrupoId;
  }

  if (filtro?.categoriaId) {
    where.categoriaId = filtro.categoriaId;
  }

  if (filtro?.somenteAtrasados) {
    where.slaStatus = 'ATRASADO';
  }

  if (filtro?.criadoDe || filtro?.criadoAte) {
    where.criadoEm = {
      ...(filtro.criadoDe ? { gte: new Date(filtro.criadoDe) } : {}),
      ...(filtro.criadoAte ? { lte: endOfDay(filtro.criadoAte) } : {})
    };
  }

  const termo = filtro?.termo?.trim();

  if (termo) {
    const numero = Number(termo.replace('#', ''));
    const searchOr = [
      { titulo: { contains: termo } },
      { descricao: { contains: termo } },
      ...(Number.isFinite(numero) && numero > 0 ? [{ numero }] : [])
    ];

    if (where.OR) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { OR: where.OR },
        { OR: searchOr }
      ];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  return where;
}

function endOfDay(value: string): Date {
  const date = new Date(value);

  date.setHours(23, 59, 59, 999);

  return date;
}
