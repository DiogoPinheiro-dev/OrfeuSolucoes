import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFuncionalidadeInput } from './dto/create-funcionalidade.input';
import { CreateSolucaoInput } from './dto/create-solucao.input';
import { FuncionalidadeType } from './dto/funcionalidade.type';
import { SolucaoType } from './dto/solucao.type';
import { UpdateFuncionalidadeInput } from './dto/update-funcionalidade.input';
import { UpdateSolucaoInput } from './dto/update-solucao.input';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { toFuncionalidadeType } from './mappers/funcionalidade.mapper';
import { toType } from './mappers/solucao.mapper';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { FuncionalidadeRecord, SolucaoRecord } from './types/solucao-record.types';
import { normalizeSlug } from './utils/slug.util';

@Injectable()
export class SolucaoCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService,
    private readonly solucaoAcessoService: SolucaoAcessoService
  ) {}

  async create(input: CreateSolucaoInput): Promise<SolucaoType> {
    const slug = normalizeSlug(input.slug);
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

    return toType(created);
  }

  async update(input: UpdateSolucaoInput): Promise<SolucaoType> {
    await this.ensureSolucao(input.id);

    const updated = (await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
      where: { id: input.id },
      data: {
        ...(input.slug !== undefined ? { slug: normalizeSlug(input.slug) } : {}),
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

    return toType(updated);
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
        slug: normalizeSlug(input.slug),
        titulo: input.titulo.trim(),
        label: input.label?.trim() || null,
        descricao: input.descricao?.trim() || null,
        ordem: input.ordem ?? 0,
        ativo: input.ativo ?? true,
        registryKey: input.registryKey?.trim() || null,
        somenteAdminSistema: input.somenteAdminSistema ?? false
      }
    })) as FuncionalidadeRecord;

    await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(created.id, input.acoes);
    await this.solucaoAcessoService.syncNewFuncionalidadeAccess(created);

    return toFuncionalidadeType(await this.findFuncionalidadeRecord(created.id));
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
        ...(input.slug !== undefined ? { slug: normalizeSlug(input.slug) } : {}),
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
      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(input.id, input.acoes);
    }

    if (input.solucaoId !== undefined) {
      await this.solucaoAcessoService.resyncFuncionalidadeAccess(updated);
    }

    return toFuncionalidadeType(await this.findFuncionalidadeRecord(input.id));
  }

  async removeFuncionalidade(id: number): Promise<boolean> {
    await this.ensureFuncionalidade(id);
    await (this.prisma as never as { funcionalidade: { delete: Function } }).funcionalidade.delete({ where: { id } });
    return true;
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
}
