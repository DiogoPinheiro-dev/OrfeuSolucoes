import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FormFieldConflictException } from '../../common/exceptions/form-field.exception';
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
      throw new FormFieldConflictException('slug', 'Solucao ja cadastrada com este identificador.');
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
        somenteAdminSistema: input.somenteAdminSistema ?? false,
        statusPublicacao: 'RASCUNHO'
      },
      include: { funcionalidades: { include: { acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] } } } }
    })) as SolucaoRecord;

    return toType(created);
  }

  async update(input: UpdateSolucaoInput): Promise<SolucaoType> {
    const current = await this.ensureSolucao(input.id);

    const orderOnly = input.ordem !== undefined && Object.keys(input).every((key) => key === 'id' || key === 'ordem');
    if (current.statusPublicacao !== 'RASCUNHO' && !orderOnly) {
      throw new BadRequestException('Crie e publique um rascunho versionado para alterar uma solucao publicada.');
    }

    if (input.slug !== undefined) {
      const slug = normalizeSlug(input.slug);
      const existing = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
        where: { slug }
      })) as SolucaoRecord | null;
      if (existing && existing.id !== input.id) {
        throw new FormFieldConflictException('slug', 'Solucao ja cadastrada com este identificador.');
      }
    }

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
    const solucao = await this.ensureSolucao(id);
    if (solucao.padraoSistema) {
      throw new BadRequestException('Uma solucao padrao do sistema nao pode ser excluida.');
    }
    if (solucao.statusPublicacao !== 'RASCUNHO') {
      throw new BadRequestException('Somente uma solucao customizada nunca publicada pode ser excluida. Despublique itens publicados.');
    }
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
        somenteAdminSistema: input.somenteAdminSistema ?? false,
        statusPublicacao: 'RASCUNHO',
        providerKey: input.providerKey?.trim() || input.registryKey?.trim() || null,
        providerVersion: input.providerVersion ?? ((input.providerKey?.trim() || input.registryKey?.trim()) ? 1 : null)
      }
    })) as FuncionalidadeRecord;

    await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(created.id, input.acoes, { includeDefaultActions: false });

    return toFuncionalidadeType(await this.findFuncionalidadeRecord(created.id));
  }

  async updateFuncionalidade(input: UpdateFuncionalidadeInput): Promise<FuncionalidadeType> {
    const existing = await this.ensureFuncionalidade(input.id);

    if (existing.statusPublicacao !== 'RASCUNHO') {
      const orderOnly = input.ordem !== undefined && Object.keys(input).every((key) => key === 'id' || key === 'ordem');
      if (orderOnly) {
        await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({ where: { id: input.id }, data: { ordem: input.ordem } });
        return toFuncionalidadeType(await this.findFuncionalidadeRecord(input.id));
      }
      const hasCadastralChanges = input.solucaoId !== undefined || input.slug !== undefined || input.titulo !== undefined ||
        input.label !== undefined || input.descricao !== undefined || input.ativo !== undefined ||
        input.registryKey !== undefined || input.providerKey !== undefined || input.providerVersion !== undefined ||
        input.somenteAdminSistema !== undefined;
      if (hasCadastralChanges) throw new BadRequestException('Crie e publique um rascunho versionado para alterar uma funcionalidade publicada.');
      await this.funcionalidadeAcaoService.appendFuncionalidadeAcoes(input.id, input.acoes ?? []);
      return toFuncionalidadeType(await this.findFuncionalidadeRecord(input.id));
    }

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
        ...(input.providerKey !== undefined ? { providerKey: input.providerKey?.trim() || null } : {}),
        ...(input.providerVersion !== undefined ? { providerVersion: input.providerVersion } : {}),
        ...(input.somenteAdminSistema !== undefined ? { somenteAdminSistema: input.somenteAdminSistema } : {})
      }
    })) as FuncionalidadeRecord;

    if (input.acoes !== undefined) {
      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(input.id, input.acoes, { includeDefaultActions: false });
    }

    return toFuncionalidadeType(await this.findFuncionalidadeRecord(input.id));
  }

  async removeFuncionalidade(id: number): Promise<boolean> {
    const funcionalidade = await this.ensureFuncionalidade(id);

    if (funcionalidade.padraoSistema) {
      throw new BadRequestException('Uma funcionalidade padrao do sistema nao pode ser excluida.');
    }
    if (funcionalidade.statusPublicacao !== 'RASCUNHO') {
      throw new BadRequestException('Somente uma funcionalidade customizada nunca publicada pode ser excluida. Despublique itens publicados.');
    }

    await (this.prisma as never as { funcionalidade: { delete: Function } }).funcionalidade.delete({ where: { id } });
    return true;
  }

  private async ensureSolucao(id: number): Promise<SolucaoRecord> {
    const exists = await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({ where: { id } }) as SolucaoRecord | null;

    if (!exists) {
      throw new NotFoundException('Solucao nao encontrada.');
    }

    return exists;
  }

  private async ensureFuncionalidade(id: number): Promise<FuncionalidadeRecord> {
    const exists = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({ where: { id } })) as FuncionalidadeRecord | null;

    if (!exists) {
      throw new NotFoundException('Funcionalidade nao encontrada.');
    }

    return exists;
  }

  private async findFuncionalidadeRecord(id: number): Promise<FuncionalidadeRecord> {
    return (await (this.prisma as never as { funcionalidade: { findUniqueOrThrow: Function } }).funcionalidade.findUniqueOrThrow({
      where: { id },
      include: { acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] } }
    })) as FuncionalidadeRecord;
  }
}
