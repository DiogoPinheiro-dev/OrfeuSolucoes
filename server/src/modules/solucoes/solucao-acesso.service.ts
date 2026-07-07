import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeAcaoPermissao, FuncionalidadePermissao, GrupoAccessDefaults } from './types/permissao.types';
import { FuncionalidadeRecord } from './types/solucao-record.types';
import { withLegacyPermissions } from './utils/acao-permissao.util';

@Injectable()
export class SolucaoAcessoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService
  ) {}

  async syncGroupAccess(
    grupoId: number,
    solucaoIds: number[] = [],
    funcionalidadeIds: number[] = [],
    funcionalidadePermissoes: FuncionalidadePermissao[] = []
  ): Promise<void> {
    await (this.prisma as never as { grupoFuncionalidadeAcao: { deleteMany: Function } }).grupoFuncionalidadeAcao.deleteMany({ where: { grupoId } });
    await (this.prisma as never as { grupoSolucao: { deleteMany: Function; createMany: Function }; grupoFuncionalidade: { deleteMany: Function; createMany: Function } }).grupoSolucao.deleteMany({ where: { grupoId } });
    await (this.prisma as never as { grupoFuncionalidade: { deleteMany: Function; createMany: Function } }).grupoFuncionalidade.deleteMany({ where: { grupoId } });
    const permissoesByFuncionalidadeId = new Map(
      funcionalidadePermissoes.map((permissao) => [permissao.funcionalidadeId, permissao])
    );

    if (solucaoIds.length) {
      await (this.prisma as never as { grupoSolucao: { createMany: Function } }).grupoSolucao.createMany({
        data: [...new Set(solucaoIds)].map((solucaoId) => ({ grupoId, solucaoId }))
      });
    }

    if (funcionalidadeIds.length) {
      await (this.prisma as never as { grupoFuncionalidade: { createMany: Function } }).grupoFuncionalidade.createMany({
        data: [...new Set(funcionalidadeIds)].map((funcionalidadeId) => {
          const permissao = withLegacyPermissions(permissoesByFuncionalidadeId.get(funcionalidadeId));

          return {
            grupoId,
            funcionalidadeId,
            podeVisualizar: permissao?.podeVisualizar ?? true,
            podeIncluir: permissao?.podeIncluir ?? false,
            podeAlterar: permissao?.podeAlterar ?? false,
            podeExcluir: permissao?.podeExcluir ?? false
          };
        })
      });

      await this.funcionalidadeAcaoService.syncGroupActionPermissions(grupoId, [...new Set(funcionalidadeIds)], funcionalidadePermissoes);
    }
  }

  async syncCompanyAccess(empresaId: number, solucaoIds: number[] = [], funcionalidadeIds: number[] = []): Promise<void> {
    await (this.prisma as never as { empresaSolucao: { deleteMany: Function }; empresaFuncionalidade: { deleteMany: Function } }).empresaSolucao.deleteMany({ where: { empresaId } });
    await (this.prisma as never as { empresaFuncionalidade: { deleteMany: Function } }).empresaFuncionalidade.deleteMany({ where: { empresaId } });

    if (solucaoIds.length) {
      await (this.prisma as never as { empresaSolucao: { createMany: Function } }).empresaSolucao.createMany({
        data: [...new Set(solucaoIds)].map((solucaoId) => ({ empresaId, solucaoId }))
      });
    }

    if (funcionalidadeIds.length) {
      await (this.prisma as never as { empresaFuncionalidade: { createMany: Function } }).empresaFuncionalidade.createMany({
        data: [...new Set(funcionalidadeIds)].map((funcionalidadeId) => ({ empresaId, funcionalidadeId }))
      });
    }
  }

  async findGroupAccess(grupoId: number): Promise<{ solucaoIds: number[]; funcionalidadeIds: number[]; funcionalidadePermissoes: Required<FuncionalidadePermissao>[] }> {
    const [solucoes, funcionalidades, acoes] = await Promise.all([
      (this.prisma as never as { grupoSolucao: { findMany: Function } }).grupoSolucao.findMany({ where: { grupoId }, select: { solucaoId: true } }),
      (this.prisma as never as { grupoFuncionalidade: { findMany: Function } }).grupoFuncionalidade.findMany({
        where: { grupoId },
        select: {
          funcionalidadeId: true,
          podeVisualizar: true,
          podeIncluir: true,
          podeAlterar: true,
          podeExcluir: true
        }
      }),
      (this.prisma as never as { grupoFuncionalidadeAcao: { findMany: Function } }).grupoFuncionalidadeAcao.findMany({
        where: { grupoId },
        select: {
          permitido: true,
          funcionalidadeAcao: {
            select: {
              id: true,
              funcionalidadeId: true,
              chave: true
            }
          }
        }
      })
    ]);
    const acoesByFuncionalidadeId = new Map<number, FuncionalidadeAcaoPermissao[]>();

    for (const row of acoes as { permitido: boolean; funcionalidadeAcao: { id: number; funcionalidadeId: number; chave: string } }[]) {
      const funcionalidadeId = row.funcionalidadeAcao.funcionalidadeId;
      const current = acoesByFuncionalidadeId.get(funcionalidadeId) ?? [];

      current.push({
        funcionalidadeId,
        acaoId: row.funcionalidadeAcao.id,
        chave: row.funcionalidadeAcao.chave,
        permitido: row.permitido
      });
      acoesByFuncionalidadeId.set(funcionalidadeId, current);
    }

    return {
      solucaoIds: (solucoes as { solucaoId: number }[]).map((item) => item.solucaoId),
      funcionalidadeIds: (funcionalidades as { funcionalidadeId: number }[]).map((item) => item.funcionalidadeId),
      funcionalidadePermissoes: (funcionalidades as Required<FuncionalidadePermissao>[]).map((item) => ({
        funcionalidadeId: item.funcionalidadeId,
        podeVisualizar: item.podeVisualizar,
        podeIncluir: item.podeIncluir,
        podeAlterar: item.podeAlterar,
        podeExcluir: item.podeExcluir,
        acoes: acoesByFuncionalidadeId.get(item.funcionalidadeId) ?? []
      }))
    };
  }

  async findCompanyAccess(empresaId: number): Promise<{ solucaoIds: number[]; funcionalidadeIds: number[] }> {
    const [solucoes, funcionalidades] = await Promise.all([
      (this.prisma as never as { empresaSolucao: { findMany: Function } }).empresaSolucao.findMany({ where: { empresaId }, select: { solucaoId: true } }),
      (this.prisma as never as { empresaFuncionalidade: { findMany: Function } }).empresaFuncionalidade.findMany({ where: { empresaId }, select: { funcionalidadeId: true } })
    ]);

    return {
      solucaoIds: (solucoes as { solucaoId: number }[]).map((item) => item.solucaoId),
      funcionalidadeIds: (funcionalidades as { funcionalidadeId: number }[]).map((item) => item.funcionalidadeId)
    };
  }

  async findCompanySolutionSummaries(empresaId: number): Promise<Array<{ id: number; slug: string; nome: string }>> {
    const acessos = (await (this.prisma as never as { empresaSolucao: { findMany: Function } }).empresaSolucao.findMany({
      where: { empresaId },
      include: {
        solucao: {
          select: {
            id: true,
            slug: true,
            nome: true,
            ativo: true,
            ordem: true
          }
        }
      },
      orderBy: { id: 'asc' }
    })) as Array<{ solucao?: { id: number; slug: string; nome: string; ativo?: boolean; ordem?: number } | null }>;

    return acessos
      .map((acesso) => acesso.solucao)
      .filter((solucao): solucao is { id: number; slug: string; nome: string; ativo?: boolean; ordem?: number } => !!solucao && solucao.ativo !== false)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome))
      .map((solucao) => ({
        id: solucao.id,
        slug: solucao.slug,
        nome: solucao.nome
      }));
  }

  async findGroupSolutionIds(grupoId?: number | null): Promise<Set<number>> {
    if (!grupoId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { grupoSolucao: { findMany: Function } }).grupoSolucao.findMany({
      where: { grupoId },
      select: { solucaoId: true }
    })) as { solucaoId: number }[];

    return new Set(rows.map((row) => row.solucaoId));
  }

  async findGroupFeatureIds(grupoId?: number | null): Promise<Set<number>> {
    if (!grupoId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { grupoFuncionalidade: { findMany: Function } }).grupoFuncionalidade.findMany({
      where: { grupoId },
      select: { funcionalidadeId: true }
    })) as { funcionalidadeId: number }[];

    return new Set(rows.map((row) => row.funcionalidadeId));
  }

  async findGroupFeaturePermissions(grupoId?: number | null): Promise<Map<number, Required<FuncionalidadePermissao>>> {
    if (!grupoId) {
      return new Map();
    }

    const access = await this.findGroupAccess(grupoId);

    return new Map(access.funcionalidadePermissoes.map((row) => [row.funcionalidadeId, withLegacyPermissions(row)]));
  }

  async findCompanySolutionIds(empresaId?: number | null): Promise<Set<number>> {
    if (!empresaId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { empresaSolucao: { findMany: Function } }).empresaSolucao.findMany({
      where: { empresaId },
      select: { solucaoId: true }
    })) as { solucaoId: number }[];

    return new Set(rows.map((row) => row.solucaoId));
  }

  async findCompanyFeatureIds(empresaId?: number | null): Promise<Set<number>> {
    if (!empresaId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { empresaFuncionalidade: { findMany: Function } }).empresaFuncionalidade.findMany({
      where: { empresaId },
      select: { funcionalidadeId: true }
    })) as { funcionalidadeId: number }[];

    return new Set(rows.map((row) => row.funcionalidadeId));
  }

  async syncNewFuncionalidadeAccess(funcionalidade: FuncionalidadeRecord): Promise<void> {
    const [grupos, empresas] = await Promise.all([
      (this.prisma as never as { grupoSolucao: { findMany: Function } }).grupoSolucao.findMany({
        where: { solucaoId: funcionalidade.solucaoId },
        include: { grupo: true }
      }),
      (this.prisma as never as { empresaSolucao: { findMany: Function } }).empresaSolucao.findMany({
        where: { solucaoId: funcionalidade.solucaoId },
        select: { empresaId: true }
      })
    ]);

    if ((grupos as { grupoId: number; grupo?: GrupoAccessDefaults }[]).length) {
      await (this.prisma as never as { grupoFuncionalidade: { createMany: Function } }).grupoFuncionalidade.createMany({
        data: (grupos as { grupoId: number; grupo?: GrupoAccessDefaults }[]).map((item) => ({
          grupoId: item.grupoId,
          funcionalidadeId: funcionalidade.id,
          podeVisualizar: item.grupo?.podeVisualizar ?? true,
          podeIncluir: item.grupo?.podeIncluir ?? false,
          podeAlterar: item.grupo?.podeAlterar ?? false,
          podeExcluir: item.grupo?.podeExcluir ?? false
        }))
      });

      await this.funcionalidadeAcaoService.syncMissingActionPermissionsForFeature(funcionalidade.id);
    }

    if ((empresas as { empresaId: number }[]).length) {
      await (this.prisma as never as { empresaFuncionalidade: { createMany: Function } }).empresaFuncionalidade.createMany({
        data: (empresas as { empresaId: number }[]).map((item) => ({
          empresaId: item.empresaId,
          funcionalidadeId: funcionalidade.id
        }))
      });
    }
  }

  async resyncFuncionalidadeAccess(funcionalidade: FuncionalidadeRecord): Promise<void> {
    await Promise.all([
      (this.prisma as never as { grupoFuncionalidadeAcao: { deleteMany: Function } }).grupoFuncionalidadeAcao.deleteMany({
        where: { funcionalidadeAcao: { funcionalidadeId: funcionalidade.id } }
      }),
      (this.prisma as never as { grupoFuncionalidade: { deleteMany: Function } }).grupoFuncionalidade.deleteMany({
        where: { funcionalidadeId: funcionalidade.id }
      }),
      (this.prisma as never as { empresaFuncionalidade: { deleteMany: Function } }).empresaFuncionalidade.deleteMany({
        where: { funcionalidadeId: funcionalidade.id }
      })
    ]);

    await this.syncNewFuncionalidadeAccess(funcionalidade);
  }
}
