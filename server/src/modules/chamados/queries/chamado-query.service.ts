import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { STATUS } from '../constants/chamado.constants';
import { chamadoDetailInclude, chamadoSummaryInclude } from '../constants/chamado-prisma.constants';
import { ChamadoFiltroInput } from '../dto/chamado-filtro.input';
import { ChamadoPageType } from '../dto/chamado.type';
import { toChamadoType } from '../mappers/chamado.mapper';
import { ChamadoRecord } from '../types/chamado-record.types';
import { buildChamadoWhere } from './chamado-filtro.builder';

type NormalizeChamadoValue = (
  value: string | null | undefined,
  allowed: typeof STATUS,
  fallback: typeof STATUS[number] | undefined,
  fieldName: string
) => typeof STATUS[number];

@Injectable()
export class ChamadoQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findChamadosPage(
    empresaId: number,
    filtro: ChamadoFiltroInput | null | undefined,
    extraWhere: Record<string, unknown>,
    normalizeValue: NormalizeChamadoValue
  ): Promise<ChamadoPageType> {
    const page = Math.max(1, Number(filtro?.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(filtro?.pageSize ?? 20)));
    const where = buildChamadoWhere(empresaId, filtro, extraWhere, normalizeValue);
    const db = this.prisma as never as {
      chamado: { count: Function; findMany: Function };
    };

    const [total, chamados] = await Promise.all([
      db.chamado.count({ where }) as Promise<number>,
      db.chamado.findMany({
        where,
        include: chamadoSummaryInclude,
        orderBy: [{ atualizadoEm: 'desc' }, { numero: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }) as Promise<ChamadoRecord[]>
    ]);

    return {
      items: chamados.map((chamado) => toChamadoType(chamado)),
      total,
      page,
      pageSize
    };
  }

  async findChamadoRecordOrThrow(id: string, empresaId: number, detailed = false): Promise<ChamadoRecord> {
    const chamado = (await (this.prisma as never as { chamado: { findFirst: Function } }).chamado.findFirst({
      where: { id, empresaId },
      include: detailed ? chamadoDetailInclude : chamadoSummaryInclude
    })) as ChamadoRecord | null;

    if (!chamado) {
      throw new NotFoundException('Chamado nao encontrado.');
    }

    return chamado;
  }
}
