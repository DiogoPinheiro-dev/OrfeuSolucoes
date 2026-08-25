import { Injectable } from '@nestjs/common';
import { retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
import { PrismaService } from '../../prisma/prisma.service';
import { HORAS_FEATURE_DEFINITIONS, HORAS_SOLUTION_DEFINITION } from './constants/horas-feature-definitions';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeRecord } from './types/solucao-record.types';

@Injectable()
export class SolucaoHorasBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService
  ) {}

  async ensureHorasSolutionUnavailable(): Promise<void> {
    await retryBootstrapAfterUniqueConflict(() => this.ensureHorasSolutionUnavailableOnce());
  }

  private async ensureHorasSolutionUnavailableOnce(): Promise<void> {
    const existing = await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: HORAS_SOLUTION_DEFINITION.slug },
      select: { id: true }
    }) as { id: number } | null;
    const solucao = existing
      ? await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
          where: { id: existing.id },
          data: HORAS_SOLUTION_DEFINITION,
          select: { id: true }
        }) as { id: number }
      : await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
          data: HORAS_SOLUTION_DEFINITION,
          select: { id: true }
        }) as { id: number };

    const funcionalidadeIds: number[] = [];

    for (const feature of HORAS_FEATURE_DEFINITIONS) {
      const existingFeature = await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
        where: { solucaoId_slug: { solucaoId: solucao.id, slug: feature.slug } }
      }) as FuncionalidadeRecord | null;
      const data = {
        ...feature,
        ativo: false,
        somenteAdminSistema: false,
        padraoSistema: true
      };
      const funcionalidade = existingFeature
        ? await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
            where: { id: existingFeature.id },
            data
          }) as FuncionalidadeRecord
        : await (this.prisma as never as { funcionalidade: { create: Function } }).funcionalidade.create({
            data: { solucaoId: solucao.id, ...data }
          }) as FuncionalidadeRecord;

      funcionalidadeIds.push(funcionalidade.id);
      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(
        funcionalidade.id,
        undefined,
        { preserveAdditionalActions: true }
      );
    }

    await this.removeInactiveAccess(solucao.id, funcionalidadeIds);
  }

  private async removeInactiveAccess(solucaoId: number, funcionalidadeIds: number[]): Promise<void> {
    await (this.prisma as never as { grupoFuncionalidadeAcao: { deleteMany: Function } }).grupoFuncionalidadeAcao.deleteMany({
      where: { funcionalidadeAcao: { funcionalidadeId: { in: funcionalidadeIds } } }
    });
    await (this.prisma as never as { grupoFuncionalidade: { deleteMany: Function } }).grupoFuncionalidade.deleteMany({
      where: { funcionalidadeId: { in: funcionalidadeIds } }
    });
    await (this.prisma as never as { empresaFuncionalidade: { deleteMany: Function } }).empresaFuncionalidade.deleteMany({
      where: { funcionalidadeId: { in: funcionalidadeIds } }
    });
    await (this.prisma as never as { grupoSolucao: { deleteMany: Function } }).grupoSolucao.deleteMany({ where: { solucaoId } });
    await (this.prisma as never as { empresaSolucao: { deleteMany: Function } }).empresaSolucao.deleteMany({ where: { solucaoId } });
  }
}
