import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateFuncionalidadeInput } from './dto/create-funcionalidade.input';
import { CreateSolucaoInput } from './dto/create-solucao.input';
import { FuncionalidadeType } from './dto/funcionalidade.type';
import { SolucaoType } from './dto/solucao.type';
import { UpdateFuncionalidadeInput } from './dto/update-funcionalidade.input';
import { UpdateSolucaoInput } from './dto/update-solucao.input';

type SolucaoRecord = {
  id: number;
  slug: string;
  nome: string;
  descricao?: string | null;
  eyebrow?: string | null;
  status?: string | null;
  ordem: number;
  ativo: boolean;
  exibirNoHub: boolean;
  somenteAdminSistema: boolean;
  funcionalidades?: FuncionalidadeRecord[];
};

type FuncionalidadeRecord = {
  id: number;
  solucaoId: number;
  slug: string;
  titulo: string;
  label?: string | null;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  registryKey?: string | null;
  somenteAdminSistema: boolean;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
};

export type FuncionalidadePermissao = {
  funcionalidadeId: number;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
};

type GrupoAccessDefaults = {
  podeVisualizar?: boolean | null;
  podeIncluir?: boolean | null;
  podeAlterar?: boolean | null;
  podeExcluir?: boolean | null;
};

@Injectable()
export class SolucoesService {
  constructor(private readonly prisma: PrismaService) {}

  async myHubNavigation(user: JwtPayload): Promise<SolucaoType[]> {
    const solucoes = await this.findAll();
    const groupSolutionIds = await this.findGroupSolutionIds(user.grupo?.id);
    const groupFeaturePermissions = await this.findGroupFeaturePermissions(user.grupo?.id);
    const companySolutionIds = await this.findCompanySolutionIds(user.empresaId);
    const companyFeatureIds = await this.findCompanyFeatureIds(user.empresaId);
    const isSystemAdmin = this.isSystemAdmin(user);

    return solucoes
      .filter((solucao) => solucao.ativo && solucao.exibirNoHub)
      .filter((solucao) => {
        if (solucao.somenteAdminSistema) {
          return isSystemAdmin;
        }

        return groupSolutionIds.has(solucao.id) && companySolutionIds.has(solucao.id);
      })
      .map((solucao) => ({
        ...solucao,
        funcionalidades: solucao.funcionalidades
          .filter((funcionalidade) => funcionalidade.ativo)
          .filter((funcionalidade) => {
            if (solucao.somenteAdminSistema || funcionalidade.somenteAdminSistema) {
              return isSystemAdmin;
            }

            const permissao = groupFeaturePermissions.get(funcionalidade.id);

            return !!permissao?.podeVisualizar && companyFeatureIds.has(funcionalidade.id);
          })
          .map((funcionalidade) => {
            if (isSystemAdmin) {
              return this.withPermissions(funcionalidade, {
                funcionalidadeId: funcionalidade.id,
                podeVisualizar: true,
                podeIncluir: true,
                podeAlterar: true,
                podeExcluir: true
              });
            }

            return this.withPermissions(funcionalidade, groupFeaturePermissions.get(funcionalidade.id));
          })
      }));
  }

  async resolveAvailableSolutionSlugs(user: { login?: string | null; grupo?: { id?: number | null } | null }, empresaId?: number | null): Promise<string[]> {
    const navigation = await this.myHubNavigation({
      sub: '',
      email: '',
      login: user.login ?? null,
      grupo: user.grupo?.id ? { id: user.grupo.id, nome: '', acessoEcommerce: false, acessoProjetos: false, acessoHoras: false, acessoConfigurador: false } : null,
      empresaId: empresaId ?? null
    });

    return navigation.map((solucao) => solucao.slug);
  }

  async findAll(): Promise<SolucaoType[]> {
    const solucoes = (await (this.prisma as never as { solucao: { findMany: Function } }).solucao.findMany({
      include: {
        funcionalidades: {
          orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }]
        }
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    })) as SolucaoRecord[];

    return solucoes.map((solucao) => this.toType(solucao));
  }

  async create(input: CreateSolucaoInput): Promise<SolucaoType> {
    const slug = this.normalizeSlug(input.slug);
    const existing = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug }
    })) as SolucaoRecord | null;

    if (existing) {
      throw new ConflictException('Solucao ja cadastrada.');
    }

    const created = (await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
      data: {
        slug,
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() || null,
        eyebrow: input.eyebrow?.trim() || null,
        status: input.status?.trim() || null,
        ordem: input.ordem ?? 0,
        ativo: input.ativo ?? true,
        exibirNoHub: input.exibirNoHub ?? true,
        somenteAdminSistema: input.somenteAdminSistema ?? false
      },
      include: { funcionalidades: true }
    })) as SolucaoRecord;

    return this.toType(created);
  }

  async update(input: UpdateSolucaoInput): Promise<SolucaoType> {
    await this.ensureSolucao(input.id);

    const updated = (await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
      where: { id: input.id },
      data: {
        ...(input.slug !== undefined ? { slug: this.normalizeSlug(input.slug) } : {}),
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.eyebrow !== undefined ? { eyebrow: input.eyebrow?.trim() || null } : {}),
        ...(input.status !== undefined ? { status: input.status?.trim() || null } : {}),
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.exibirNoHub !== undefined ? { exibirNoHub: input.exibirNoHub } : {}),
        ...(input.somenteAdminSistema !== undefined ? { somenteAdminSistema: input.somenteAdminSistema } : {})
      },
      include: { funcionalidades: { orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }] } }
    })) as SolucaoRecord;

    return this.toType(updated);
  }

  async remove(id: number): Promise<boolean> {
    await this.ensureSolucao(id);
    await (this.prisma as never as { solucao: { delete: Function } }).solucao.delete({ where: { id } });
    return true;
  }

  async createFuncionalidade(input: CreateFuncionalidadeInput): Promise<FuncionalidadeType> {
    await this.ensureSolucao(input.solucaoId);

    const created = (await (this.prisma as never as { funcionalidade: { create: Function } }).funcionalidade.create({
      data: {
        solucaoId: input.solucaoId,
        slug: this.normalizeSlug(input.slug),
        titulo: input.titulo.trim(),
        label: input.label?.trim() || null,
        descricao: input.descricao?.trim() || null,
        ordem: input.ordem ?? 0,
        ativo: input.ativo ?? true,
        registryKey: input.registryKey?.trim() || null,
        somenteAdminSistema: input.somenteAdminSistema ?? false
      }
    })) as FuncionalidadeRecord;

    await this.syncNewFuncionalidadeAccess(created);

    return this.toFuncionalidadeType(created);
  }

  async updateFuncionalidade(input: UpdateFuncionalidadeInput): Promise<FuncionalidadeType> {
    await this.ensureFuncionalidade(input.id);

    if (input.solucaoId !== undefined) {
      await this.ensureSolucao(input.solucaoId);
    }

    const updated = (await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
      where: { id: input.id },
      data: {
        ...(input.solucaoId !== undefined ? { solucaoId: input.solucaoId } : {}),
        ...(input.slug !== undefined ? { slug: this.normalizeSlug(input.slug) } : {}),
        ...(input.titulo !== undefined ? { titulo: input.titulo.trim() } : {}),
        ...(input.label !== undefined ? { label: input.label?.trim() || null } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.registryKey !== undefined ? { registryKey: input.registryKey?.trim() || null } : {}),
        ...(input.somenteAdminSistema !== undefined ? { somenteAdminSistema: input.somenteAdminSistema } : {})
      }
    })) as FuncionalidadeRecord;

    if (input.solucaoId !== undefined) {
      await this.resyncFuncionalidadeAccess(updated);
    }

    return this.toFuncionalidadeType(updated);
  }

  async removeFuncionalidade(id: number): Promise<boolean> {
    await this.ensureFuncionalidade(id);
    await (this.prisma as never as { funcionalidade: { delete: Function } }).funcionalidade.delete({ where: { id } });
    return true;
  }

  async syncGroupAccess(
    grupoId: number,
    solucaoIds: number[] = [],
    funcionalidadeIds: number[] = [],
    funcionalidadePermissoes: FuncionalidadePermissao[] = []
  ): Promise<void> {
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
          const permissao = permissoesByFuncionalidadeId.get(funcionalidadeId);

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
    const [solucoes, funcionalidades] = await Promise.all([
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
      })
    ]);

    return {
      solucaoIds: (solucoes as { solucaoId: number }[]).map((item) => item.solucaoId),
      funcionalidadeIds: (funcionalidades as { funcionalidadeId: number }[]).map((item) => item.funcionalidadeId),
      funcionalidadePermissoes: (funcionalidades as Required<FuncionalidadePermissao>[]).map((item) => ({
        funcionalidadeId: item.funcionalidadeId,
        podeVisualizar: item.podeVisualizar,
        podeIncluir: item.podeIncluir,
        podeAlterar: item.podeAlterar,
        podeExcluir: item.podeExcluir
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

  private async findGroupSolutionIds(grupoId?: number | null): Promise<Set<number>> {
    if (!grupoId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { grupoSolucao: { findMany: Function } }).grupoSolucao.findMany({
      where: { grupoId },
      select: { solucaoId: true }
    })) as { solucaoId: number }[];

    return new Set(rows.map((row) => row.solucaoId));
  }

  private async findGroupFeatureIds(grupoId?: number | null): Promise<Set<number>> {
    if (!grupoId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { grupoFuncionalidade: { findMany: Function } }).grupoFuncionalidade.findMany({
      where: { grupoId },
      select: { funcionalidadeId: true }
    })) as { funcionalidadeId: number }[];

    return new Set(rows.map((row) => row.funcionalidadeId));
  }

  private async findGroupFeaturePermissions(grupoId?: number | null): Promise<Map<number, Required<FuncionalidadePermissao>>> {
    if (!grupoId) {
      return new Map();
    }

    const rows = (await (this.prisma as never as { grupoFuncionalidade: { findMany: Function } }).grupoFuncionalidade.findMany({
      where: { grupoId },
      select: {
        funcionalidadeId: true,
        podeVisualizar: true,
        podeIncluir: true,
        podeAlterar: true,
        podeExcluir: true
      }
    })) as Required<FuncionalidadePermissao>[];

    return new Map(rows.map((row) => [row.funcionalidadeId, row]));
  }

  private async findCompanySolutionIds(empresaId?: number | null): Promise<Set<number>> {
    if (!empresaId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { empresaSolucao: { findMany: Function } }).empresaSolucao.findMany({
      where: { empresaId },
      select: { solucaoId: true }
    })) as { solucaoId: number }[];

    return new Set(rows.map((row) => row.solucaoId));
  }

  private async findCompanyFeatureIds(empresaId?: number | null): Promise<Set<number>> {
    if (!empresaId) {
      return new Set();
    }

    const rows = (await (this.prisma as never as { empresaFuncionalidade: { findMany: Function } }).empresaFuncionalidade.findMany({
      where: { empresaId },
      select: { funcionalidadeId: true }
    })) as { funcionalidadeId: number }[];

    return new Set(rows.map((row) => row.funcionalidadeId));
  }

  private async ensureSolucao(id: number): Promise<void> {
    const exists = await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({ where: { id } });

    if (!exists) {
      throw new NotFoundException('Solucao nao encontrada.');
    }
  }

  private async ensureFuncionalidade(id: number): Promise<void> {
    const exists = await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({ where: { id } });

    if (!exists) {
      throw new NotFoundException('Funcionalidade nao encontrada.');
    }
  }

  private normalizeSlug(slug: string): string {
    return slug.trim().toLowerCase();
  }

  private isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  private toType(solucao: SolucaoRecord): SolucaoType {
    return {
      id: solucao.id,
      slug: solucao.slug,
      nome: solucao.nome,
      descricao: solucao.descricao ?? null,
      eyebrow: solucao.eyebrow ?? null,
      status: solucao.status ?? null,
      ordem: solucao.ordem,
      ativo: solucao.ativo,
      exibirNoHub: solucao.exibirNoHub,
      somenteAdminSistema: solucao.somenteAdminSistema,
      funcionalidades: (solucao.funcionalidades ?? []).map((funcionalidade) => this.toFuncionalidadeType(funcionalidade))
    };
  }

  private toFuncionalidadeType(funcionalidade: FuncionalidadeRecord): FuncionalidadeType {
    return {
      id: funcionalidade.id,
      slug: funcionalidade.slug,
      titulo: funcionalidade.titulo,
      label: funcionalidade.label ?? null,
      descricao: funcionalidade.descricao ?? null,
      ordem: funcionalidade.ordem,
      ativo: funcionalidade.ativo,
      registryKey: funcionalidade.registryKey ?? null,
      somenteAdminSistema: funcionalidade.somenteAdminSistema,
      podeVisualizar: funcionalidade.podeVisualizar ?? true,
      podeIncluir: funcionalidade.podeIncluir ?? false,
      podeAlterar: funcionalidade.podeAlterar ?? false,
      podeExcluir: funcionalidade.podeExcluir ?? false
    };
  }

  private withPermissions(funcionalidade: FuncionalidadeType, permissao?: FuncionalidadePermissao): FuncionalidadeType {
    return {
      ...funcionalidade,
      podeVisualizar: permissao?.podeVisualizar ?? true,
      podeIncluir: permissao?.podeIncluir ?? false,
      podeAlterar: permissao?.podeAlterar ?? false,
      podeExcluir: permissao?.podeExcluir ?? false
    };
  }

  private async syncNewFuncionalidadeAccess(funcionalidade: FuncionalidadeRecord): Promise<void> {
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

  private async resyncFuncionalidadeAccess(funcionalidade: FuncionalidadeRecord): Promise<void> {
    await Promise.all([
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
