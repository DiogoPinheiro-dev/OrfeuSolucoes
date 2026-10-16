import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calcularProjetoIndicadores } from './policies/projeto-indicadores.policy';
import { ProjetoSprintStatus } from './types/projeto-sprint.types';
import { ProjetoRecord } from './types/projeto.types';

const USUARIO_SELECT = { nome: true, login: true, email: true };
const ITEM_INDICADOR_SELECT = {
  id: true,
  status: true,
  estimativaMinutos: true,
  inicioPrevistoEm: true,
  fimPrevistoEm: true,
  arquivadoEm: true
};

type ContextoIndicadores = {
  empresaId: number;
  projeto: ProjetoRecord;
  agora: Date;
  hojeOperacional: string;
};

@Injectable()
export class ProjetoIndicadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(contexto: ContextoIndicadores) {
    const { empresaId, projeto, agora, hojeOperacional } = contexto;
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [
      itens,
      sprintAtiva,
      dependencias,
      marcos,
      entregas,
      ultimaAtualizacao,
      eventosNosUltimosSeteDias,
      ultimoEvento,
      esforcoPorStatus
    ] = await Promise.all([
      this.prisma.projetoItem.findMany({
        where: { empresaId, projetoId: projeto.id, arquivadoEm: null },
        select: ITEM_INDICADOR_SELECT
      }),
      this.prisma.projetoSprint.findFirst({
        where: { empresaId, projetoId: projeto.id, status: ProjetoSprintStatus.ATIVA },
        include: { itens: { include: { item: { select: ITEM_INDICADOR_SELECT } } } },
        orderBy: { inicioRealEm: 'desc' }
      }),
      this.prisma.projetoItemDependencia.findMany({
        where: { empresaId, projetoId: projeto.id, arquivadoEm: null },
        include: {
          bloqueador: { select: ITEM_INDICADOR_SELECT },
          bloqueado: { select: ITEM_INDICADOR_SELECT }
        }
      }),
      this.prisma.projetoMarco.findMany({
        where: { empresaId, projetoId: projeto.id, arquivadoEm: null },
        include: { itens: { include: { item: { select: ITEM_INDICADOR_SELECT } } } },
        orderBy: { dataPrevistaEm: 'asc' }
      }),
      this.prisma.projetoEntrega.findMany({
        where: { empresaId, projetoId: projeto.id, arquivadoEm: null },
        include: { itens: { include: { item: { select: ITEM_INDICADOR_SELECT } } } },
        orderBy: { fimPrevistoEm: 'asc' }
      }),
      this.prisma.projetoAtualizacao.findFirst({
        where: { empresaId, projetoId: projeto.id },
        include: { autor: { select: USUARIO_SELECT } },
        orderBy: { criadoEm: 'desc' }
      }),
      this.prisma.projetoEvento.count({
        where: { empresaId, projetoId: projeto.id, criadoEm: { gte: seteDiasAtras } }
      }),
      this.prisma.projetoEvento.findFirst({
        where: { empresaId, projetoId: projeto.id },
        select: { criadoEm: true },
        orderBy: { criadoEm: 'desc' }
      }),
      this.prisma.projetoApontamento.groupBy({
        where: { empresaId, projetoId: projeto.id, arquivadoEm: null },
        by: ['status'],
        _sum: { minutos: true }
      })
    ]);

    return calcularProjetoIndicadores({
      projeto,
      itens,
      sprintAtiva,
      dependencias,
      marcos,
      entregas,
      ultimaAtualizacao,
      eventosNosUltimosSeteDias,
      ultimoEvento,
      esforcoPorStatus,
      agora,
      hojeOperacional
    });
  }
}
