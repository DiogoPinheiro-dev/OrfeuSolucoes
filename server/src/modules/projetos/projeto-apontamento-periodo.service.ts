import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoApontamentoPeriodoSituacao } from './types/projeto-apontamento.types';

export type ProjetoApontamentoNoMes = { projetoId: string; dataTrabalho: Date };

type PeriodoClient = Pick<Prisma.TransactionClient, 'projetoApontamentoPeriodo'>;

@Injectable()
export class ProjetoApontamentoPeriodoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly periodo: ProjetoPeriodoService
  ) {}

  competencia(apontamento: Pick<ProjetoApontamentoNoMes, 'dataTrabalho'>): string {
    return this.periodo.competenciaDaData(apontamento.dataTrabalho);
  }

  /** Os apontamentos informados que caem numa competência fechada do projeto. Competência sem registro está aberta. */
  async emCompetenciaFechada<T extends ProjetoApontamentoNoMes>(
    apontamentos: readonly T[],
    db: PeriodoClient = this.prisma
  ): Promise<Set<T>> {
    if (!apontamentos.length) {
      return new Set();
    }

    const periodos = await db.projetoApontamentoPeriodo.findMany({
      where: {
        projetoId: { in: [...new Set(apontamentos.map((apontamento) => apontamento.projetoId))] },
        competencia: { in: [...new Set(apontamentos.map((apontamento) => this.competencia(apontamento)))] },
        situacao: ProjetoApontamentoPeriodoSituacao.FECHADO
      },
      select: { projetoId: true, competencia: true }
    });
    const fechadas = new Set(periodos.map((periodo) => `${periodo.projetoId}:${periodo.competencia}`));

    return new Set(apontamentos.filter((apontamento) =>
      fechadas.has(`${apontamento.projetoId}:${this.competencia(apontamento)}`)
    ));
  }
}
