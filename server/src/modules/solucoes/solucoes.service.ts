import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateFuncionalidadeInput } from './dto/create-funcionalidade.input';
import { CreateSolucaoInput } from './dto/create-solucao.input';
import { FuncionalidadeAcaoInput } from './dto/funcionalidade-acao.input';
import { FuncionalidadeAcaoType } from './dto/funcionalidade-acao.type';
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
  acoes?: FuncionalidadeAcaoRecord[];
};

type FuncionalidadeAcaoRecord = {
  id: number;
  funcionalidadeId: number;
  chave: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  acaoPadrao: boolean;
  configuracao?: string | null;
  permitido?: boolean;
};

export type FuncionalidadePermissao = {
  funcionalidadeId: number;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
  acoes?: FuncionalidadeAcaoPermissao[];
};

export type FuncionalidadeAcaoPermissao = {
  funcionalidadeId: number;
  acaoId: number;
  chave?: string | null;
  permitido?: boolean;
};

type GrupoAccessDefaults = {
  podeVisualizar?: boolean | null;
  podeIncluir?: boolean | null;
  podeAlterar?: boolean | null;
  podeExcluir?: boolean | null;
};

const DEFAULT_ACTIONS: FuncionalidadeAcaoInput[] = [
  { chave: 'visualizar', nome: 'Visualizar', ordem: 10, ativo: true, acaoPadrao: true },
  { chave: 'incluir', nome: 'Incluir', ordem: 20, ativo: true, acaoPadrao: true },
  { chave: 'alterar', nome: 'Alterar', ordem: 30, ativo: true, acaoPadrao: true },
  { chave: 'excluir', nome: 'Excluir', ordem: 40, ativo: true, acaoPadrao: true }
];

const LEGACY_ACTION_FIELDS: Record<string, keyof Pick<FuncionalidadePermissao, 'podeVisualizar' | 'podeIncluir' | 'podeAlterar' | 'podeExcluir'>> = {
  visualizar: 'podeVisualizar',
  incluir: 'podeIncluir',
  alterar: 'podeAlterar',
  excluir: 'podeExcluir'
};

@Injectable()
export class SolucoesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultConfiguradorFeatures(): Promise<void> {
    const configurador = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: 'configurador' },
      select: { id: true }
    })) as { id: number } | null;

    if (!configurador) {
      return;
    }

    await this.mergeDuplicateConfiguradorFeature(
      configurador.id,
      'cadastro-de-soluções',
      'cadastro-de-solucoes'
    );

    const defaultFeatures = [
      {
        slug: 'cadastro-de-solucoes',
        titulo: 'Cadastro de solucoes',
        label: 'Solucoes',
        descricao: 'Crie e mantenha as solucoes exibidas no hub do sistema.',
        ordem: 35,
        registryKey: 'configurador.cadastro-de-solucoes'
      }
    ];

    for (const feature of defaultFeatures) {
      const existing = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
        where: {
          solucaoId_slug: {
            solucaoId: configurador.id,
            slug: feature.slug
          }
        }
      })) as FuncionalidadeRecord | null;
      const funcionalidade = existing
        ? (await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
            where: { id: existing.id },
            data: {
              titulo: feature.titulo,
              label: feature.label,
              descricao: feature.descricao,
              ordem: feature.ordem,
              ativo: true,
              registryKey: feature.registryKey,
              somenteAdminSistema: true
            }
          })) as FuncionalidadeRecord
        : (await (this.prisma as never as { funcionalidade: { create: Function } }).funcionalidade.create({
            data: {
              solucaoId: configurador.id,
              slug: feature.slug,
              titulo: feature.titulo,
              label: feature.label,
              descricao: feature.descricao,
              ordem: feature.ordem,
              ativo: true,
              registryKey: feature.registryKey,
              somenteAdminSistema: true
            }
          })) as FuncionalidadeRecord;

      await this.syncFuncionalidadeAcoes(funcionalidade.id);

      if (!existing) {
        await this.syncNewFuncionalidadeAccess(funcionalidade);
      }
    }
  }

  async myHubNavigation(user: JwtPayload): Promise<SolucaoType[]> {
    const solucoes = await this.findAll();
    const groupSolutionIds = await this.findGroupSolutionIds(user.grupo?.id);
    const groupFeaturePermissions = await this.findGroupFeaturePermissions(user.grupo?.id);
    const companySolutionIds = await this.findCompanySolutionIds(user.empresaId);
    const companyFeatureIds = await this.findCompanyFeatureIds(user.empresaId);
    const isSystemAdmin = this.isSystemAdmin(user);
    const canBypassAccessRules = isSystemAdmin || this.hasFullAccessGroup(user.grupo);

    return solucoes
      .filter((solucao) => solucao.ativo && solucao.exibirNoHub)
      .filter((solucao) => {
        if (solucao.somenteAdminSistema) {
          return isSystemAdmin;
        }

        if (canBypassAccessRules) {
          return true;
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

            if (canBypassAccessRules) {
              return true;
            }

            const permissao = groupFeaturePermissions.get(funcionalidade.id);

            return !!permissao?.podeVisualizar && companyFeatureIds.has(funcionalidade.id);
          })
          .map((funcionalidade) => {
            if (canBypassAccessRules) {
              return this.withAllPermissions(funcionalidade);
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
          include: {
            acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] }
          },
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
        ordem: input.ordem ?? 0,
        ativo: input.ativo ?? true,
        exibirNoHub: input.exibirNoHub ?? true,
        somenteAdminSistema: input.somenteAdminSistema ?? false
      },
      include: { funcionalidades: { include: { acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] } } } }
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
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.exibirNoHub !== undefined ? { exibirNoHub: input.exibirNoHub } : {}),
        ...(input.somenteAdminSistema !== undefined ? { somenteAdminSistema: input.somenteAdminSistema } : {})
      },
      include: { funcionalidades: { include: { acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] } }, orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }] } }
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

    await this.syncFuncionalidadeAcoes(created.id, input.acoes);
    await this.syncNewFuncionalidadeAccess(created);

    return this.toFuncionalidadeType(await this.findFuncionalidadeRecord(created.id));
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

    if (input.acoes !== undefined) {
      await this.syncFuncionalidadeAcoes(input.id, input.acoes);
    }

    if (input.solucaoId !== undefined) {
      await this.resyncFuncionalidadeAccess(updated);
    }

    return this.toFuncionalidadeType(await this.findFuncionalidadeRecord(input.id));
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
          const permissao = this.withLegacyPermissions(permissoesByFuncionalidadeId.get(funcionalidadeId));

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

      await this.syncGroupActionPermissions(grupoId, [...new Set(funcionalidadeIds)], funcionalidadePermissoes);
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

    const access = await this.findGroupAccess(grupoId);

    return new Map(access.funcionalidadePermissoes.map((row) => [row.funcionalidadeId, this.withLegacyPermissions(row)]));
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

  private async findFuncionalidadeRecord(id: number): Promise<FuncionalidadeRecord> {
    return (await (this.prisma as never as { funcionalidade: { findUniqueOrThrow: Function } }).funcionalidade.findUniqueOrThrow({
      where: { id },
      include: { acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] } }
    })) as FuncionalidadeRecord;
  }

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async mergeDuplicateConfiguradorFeature(solucaoId: number, duplicateSlug: string, targetSlug: string): Promise<void> {
    const duplicate = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
      where: {
        solucaoId_slug: {
          solucaoId,
          slug: duplicateSlug
        }
      }
    })) as FuncionalidadeRecord | null;

    if (!duplicate) {
      return;
    }

    const target = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
      where: {
        solucaoId_slug: {
          solucaoId,
          slug: targetSlug
        }
      }
    })) as FuncionalidadeRecord | null;

    if (!target) {
      await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
        where: { id: duplicate.id },
        data: { slug: targetSlug }
      });
      return;
    }

    await (this.prisma as never as { funcionalidade: { delete: Function } }).funcionalidade.delete({
      where: { id: duplicate.id }
    });
  }

  private isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  private hasFullAccessGroup(grupo?: {
    acessoEcommerce?: boolean | null;
    acessoProjetos?: boolean | null;
    acessoHoras?: boolean | null;
    acessoConfigurador?: boolean | null;
  } | null): boolean {
    return !!(
      grupo?.acessoEcommerce &&
      grupo.acessoProjetos &&
      grupo.acessoHoras &&
      grupo.acessoConfigurador
    );
  }

  private normalizeActionKey(chave: string): string {
    return chave.trim().toLowerCase();
  }

  private withLegacyPermissions(permissao?: FuncionalidadePermissao): Required<FuncionalidadePermissao> {
    const actionValues = new Map((permissao?.acoes ?? []).map((acao) => [acao.chave, !!acao.permitido]));

    return {
      funcionalidadeId: permissao?.funcionalidadeId ?? 0,
      podeVisualizar: actionValues.has('visualizar') ? !!actionValues.get('visualizar') : permissao?.podeVisualizar ?? true,
      podeIncluir: actionValues.has('incluir') ? !!actionValues.get('incluir') : permissao?.podeIncluir ?? false,
      podeAlterar: actionValues.has('alterar') ? !!actionValues.get('alterar') : permissao?.podeAlterar ?? false,
      podeExcluir: actionValues.has('excluir') ? !!actionValues.get('excluir') : permissao?.podeExcluir ?? false,
      acoes: permissao?.acoes ?? []
    };
  }

  private legacyActionAllowed(chave: string, permissao: Required<FuncionalidadePermissao>): boolean {
    const field = LEGACY_ACTION_FIELDS[chave];

    return field ? !!permissao[field] : false;
  }

  private toType(solucao: SolucaoRecord): SolucaoType {
    return {
      id: solucao.id,
      slug: solucao.slug,
      nome: solucao.nome,
      descricao: solucao.descricao ?? null,
      eyebrow: solucao.eyebrow ?? null,
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
      podeExcluir: funcionalidade.podeExcluir ?? false,
      acoes: (funcionalidade.acoes ?? []).map((acao) => this.toFuncionalidadeAcaoType(acao))
    };
  }

  private withPermissions(funcionalidade: FuncionalidadeType, permissao?: FuncionalidadePermissao): FuncionalidadeType {
    const normalizedPermission = this.withLegacyPermissions(permissao);
    const acoesPermitidas = new Map((permissao?.acoes ?? []).map((acao) => [acao.acaoId, !!acao.permitido]));
    const acoes = funcionalidade.acoes.map((acao) => ({
      ...acao,
      permitido: acoesPermitidas.has(acao.id)
        ? !!acoesPermitidas.get(acao.id)
        : this.legacyActionAllowed(acao.chave, normalizedPermission)
    }));

    return {
      ...funcionalidade,
      podeVisualizar: normalizedPermission.podeVisualizar,
      podeIncluir: normalizedPermission.podeIncluir,
      podeAlterar: normalizedPermission.podeAlterar,
      podeExcluir: normalizedPermission.podeExcluir,
      acoes
    };
  }

  private withAllPermissions(funcionalidade: FuncionalidadeType): FuncionalidadeType {
    return {
      ...funcionalidade,
      podeVisualizar: true,
      podeIncluir: true,
      podeAlterar: true,
      podeExcluir: true,
      acoes: funcionalidade.acoes.map((acao) => ({ ...acao, permitido: true }))
    };
  }

  private toFuncionalidadeAcaoType(acao: FuncionalidadeAcaoRecord): FuncionalidadeAcaoType {
    return {
      id: acao.id,
      funcionalidadeId: acao.funcionalidadeId,
      chave: acao.chave,
      nome: acao.nome,
      descricao: acao.descricao ?? null,
      ordem: acao.ordem,
      ativo: acao.ativo,
      acaoPadrao: acao.acaoPadrao,
      configuracao: acao.configuracao ?? null,
      permitido: acao.permitido ?? false
    };
  }

  private normalizeActionInputs(acoes?: FuncionalidadeAcaoInput[]): FuncionalidadeAcaoInput[] {
    const byKey = new Map<string, FuncionalidadeAcaoInput>();

    for (const acao of [...DEFAULT_ACTIONS, ...(acoes ?? [])]) {
      const chave = this.normalizeActionKey(acao.chave);

      if (!chave) {
        continue;
      }

      byKey.set(chave, {
        ...acao,
        chave,
        nome: acao.nome.trim(),
        descricao: acao.descricao?.trim() || null,
        configuracao: acao.configuracao?.trim() || null,
        ordem: acao.ordem ?? 0,
        ativo: acao.ativo ?? true,
        acaoPadrao: acao.acaoPadrao ?? DEFAULT_ACTIONS.some((item) => item.chave === chave)
      });
    }

    return [...byKey.values()];
  }

  private async syncFuncionalidadeAcoes(funcionalidadeId: number, acoes?: FuncionalidadeAcaoInput[]): Promise<void> {
    const normalized = this.normalizeActionInputs(acoes);
    const submittedIds = normalized.map((acao) => acao.id).filter((id): id is number => !!id);

    await (this.prisma as never as { funcionalidadeAcao: { deleteMany: Function } }).funcionalidadeAcao.deleteMany({
      where: {
        funcionalidadeId,
        acaoPadrao: false,
        ...(submittedIds.length ? { id: { notIn: submittedIds } } : {})
      }
    });

    for (const acao of normalized) {
      const data = {
        funcionalidadeId,
        chave: acao.chave,
        nome: acao.nome,
        descricao: acao.descricao ?? null,
        ordem: acao.ordem ?? 0,
        ativo: acao.ativo ?? true,
        acaoPadrao: acao.acaoPadrao ?? false,
        configuracao: acao.configuracao ?? null
      };

      if (acao.id) {
        await (this.prisma as never as { funcionalidadeAcao: { update: Function } }).funcionalidadeAcao.update({
          where: { id: acao.id },
          data
        });
      } else {
        await (this.prisma as never as { funcionalidadeAcao: { upsert: Function } }).funcionalidadeAcao.upsert({
          where: { funcionalidadeId_chave: { funcionalidadeId, chave: acao.chave } },
          update: data,
          create: data
        });
      }
    }

    await this.syncMissingActionPermissionsForFeature(funcionalidadeId);
  }

  private async syncGroupActionPermissions(
    grupoId: number,
    funcionalidadeIds: number[],
    funcionalidadePermissoes: FuncionalidadePermissao[]
  ): Promise<void> {
    const acoes = (await (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
      where: { funcionalidadeId: { in: funcionalidadeIds }, ativo: true },
      select: { id: true, funcionalidadeId: true, chave: true }
    })) as Pick<FuncionalidadeAcaoRecord, 'id' | 'funcionalidadeId' | 'chave'>[];

    if (!acoes.length) {
      return;
    }

    const permissoesByFuncionalidadeId = new Map(
      funcionalidadePermissoes.map((permissao) => [permissao.funcionalidadeId, this.withLegacyPermissions(permissao)])
    );
    const permittedByActionId = new Map(
      funcionalidadePermissoes
        .flatMap((permissao) => permissao.acoes ?? [])
        .map((acao) => [acao.acaoId, !!acao.permitido])
    );

    await (this.prisma as never as { grupoFuncionalidadeAcao: { createMany: Function } }).grupoFuncionalidadeAcao.createMany({
      data: acoes.map((acao) => {
        const permissao = permissoesByFuncionalidadeId.get(acao.funcionalidadeId);

        return {
          grupoId,
          funcionalidadeAcaoId: acao.id,
          permitido: permittedByActionId.has(acao.id)
            ? !!permittedByActionId.get(acao.id)
            : this.legacyActionAllowed(acao.chave, permissao ?? this.withLegacyPermissions({ funcionalidadeId: acao.funcionalidadeId }))
        };
      })
    });
  }

  private async syncMissingActionPermissionsForFeature(funcionalidadeId: number): Promise<void> {
    const [grupos, acoes, existing] = await Promise.all([
      (this.prisma as never as { grupoFuncionalidade: { findMany: Function } }).grupoFuncionalidade.findMany({
        where: { funcionalidadeId },
        select: {
          grupoId: true,
          podeVisualizar: true,
          podeIncluir: true,
          podeAlterar: true,
          podeExcluir: true
        }
      }),
      (this.prisma as never as { funcionalidadeAcao: { findMany: Function } }).funcionalidadeAcao.findMany({
        where: { funcionalidadeId, ativo: true },
        select: { id: true, chave: true }
      }),
      (this.prisma as never as { grupoFuncionalidadeAcao: { findMany: Function } }).grupoFuncionalidadeAcao.findMany({
        where: { funcionalidadeAcao: { funcionalidadeId } },
        select: { grupoId: true, funcionalidadeAcaoId: true }
      })
    ]);
    const existingKeys = new Set((existing as { grupoId: number; funcionalidadeAcaoId: number }[]).map((item) => `${item.grupoId}:${item.funcionalidadeAcaoId}`));
    const data = (grupos as (GrupoAccessDefaults & { grupoId: number })[]).flatMap((grupo) =>
      (acoes as Pick<FuncionalidadeAcaoRecord, 'id' | 'chave'>[])
        .filter((acao) => !existingKeys.has(`${grupo.grupoId}:${acao.id}`))
        .map((acao) => ({
          grupoId: grupo.grupoId,
          funcionalidadeAcaoId: acao.id,
          permitido: this.legacyActionAllowed(acao.chave, this.withLegacyPermissions({
            funcionalidadeId,
            podeVisualizar: grupo.podeVisualizar ?? true,
            podeIncluir: grupo.podeIncluir ?? false,
            podeAlterar: grupo.podeAlterar ?? false,
            podeExcluir: grupo.podeExcluir ?? false
          }))
        }))
    );

    if (data.length) {
      await (this.prisma as never as { grupoFuncionalidadeAcao: { createMany: Function } }).grupoFuncionalidadeAcao.createMany({ data });
    }
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

      await this.syncMissingActionPermissionsForFeature(funcionalidade.id);
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
