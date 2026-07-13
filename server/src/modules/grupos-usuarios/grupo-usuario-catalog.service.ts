import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SolucoesService } from '../solucoes/solucoes.service';
import { CreateGrupoUsuarioInput } from './dto/create-grupo-usuario.input';
import { GrupoUsuarioType } from './dto/grupo-usuario.type';
import { UpdateGrupoUsuarioInput } from './dto/update-grupo-usuario.input';
import { GrupoUsuarioPermissaoService } from './grupo-usuario-permissao.service';
import { toGrupoUsuarioType } from './mappers/grupo-usuario.mapper';
import { assertCanRemoveGrupo } from './policies/grupo-usuario.policy';
import { GrupoUsuarioRecord } from './types/grupo-usuario-record.types';

@Injectable()
export class GrupoUsuarioCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService,
    private readonly grupoUsuarioPermissao: GrupoUsuarioPermissaoService
  ) {}

  async findAll(): Promise<GrupoUsuarioType[]> {
    const grupos = (await (this.prisma as never as { grupoUsuario: { findMany: Function } }).grupoUsuario.findMany({
      orderBy: { nome: 'asc' }
    })) as GrupoUsuarioRecord[];

    return Promise.all(grupos.map((grupo) => this.toType(grupo)));
  }

  async findById(id?: number | null): Promise<GrupoUsuarioType | null> {
    if (!id) {
      return null;
    }

    const grupo = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { id }
    })) as GrupoUsuarioRecord | null;

    return grupo ? this.toType(grupo) : null;
  }

  async create(input: CreateGrupoUsuarioInput): Promise<GrupoUsuarioType> {
    const nome = input.nome.trim();
    const existing = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { nome }
    })) as GrupoUsuarioRecord | null;

    if (existing) {
      throw new ConflictException('Grupo de usuario ja cadastrado.');
    }

    const created = (await (this.prisma as never as { grupoUsuario: { create: Function } }).grupoUsuario.create({
      data: {
        nome,
        descricao: input.descricao?.trim() || null,
        acessoEcommerce: input.acessoEcommerce ?? false,
        acessoProjetos: input.acessoProjetos ?? false,
        acessoHoras: input.acessoHoras ?? false,
        acessoConfigurador: input.acessoConfigurador ?? false,
        podeVisualizar: input.podeVisualizar ?? true,
        podeIncluir: input.podeIncluir ?? false,
        podeAlterar: input.podeAlterar ?? false,
        podeExcluir: input.podeExcluir ?? false
      }
    })) as GrupoUsuarioRecord;

    await this.solucoesService.syncGroupAccess(
      created.id,
      input.solucaoIds ?? [],
      input.funcionalidadeIds ?? [],
      this.grupoUsuarioPermissao.resolveFuncionalidadePermissoes(input.funcionalidadeIds ?? [], input.funcionalidadePermissoes, input)
    );

    return this.toType(created);
  }

  async update(input: UpdateGrupoUsuarioInput): Promise<GrupoUsuarioType> {
    const current = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { id: input.id }
    })) as GrupoUsuarioRecord | null;

    if (!current) {
      throw new NotFoundException('Grupo de usuario nao encontrado.');
    }

    const updated = (await (this.prisma as never as { grupoUsuario: { update: Function } }).grupoUsuario.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.acessoEcommerce !== undefined ? { acessoEcommerce: input.acessoEcommerce } : {}),
        ...(input.acessoProjetos !== undefined ? { acessoProjetos: input.acessoProjetos } : {}),
        ...(input.acessoHoras !== undefined ? { acessoHoras: input.acessoHoras } : {}),
        ...(input.acessoConfigurador !== undefined ? { acessoConfigurador: input.acessoConfigurador } : {}),
        ...(input.podeVisualizar !== undefined ? { podeVisualizar: input.podeVisualizar } : {}),
        ...(input.podeIncluir !== undefined ? { podeIncluir: input.podeIncluir } : {}),
        ...(input.podeAlterar !== undefined ? { podeAlterar: input.podeAlterar } : {}),
        ...(input.podeExcluir !== undefined ? { podeExcluir: input.podeExcluir } : {})
      }
    })) as GrupoUsuarioRecord;

    if (input.solucaoIds !== undefined || input.funcionalidadeIds !== undefined || input.funcionalidadePermissoes !== undefined) {
      const funcionalidadeIds = input.funcionalidadeIds ?? input.funcionalidadePermissoes?.map((permissao) => permissao.funcionalidadeId) ?? [];

      await this.solucoesService.syncGroupAccess(
        input.id,
        input.solucaoIds ?? [],
        funcionalidadeIds,
        this.grupoUsuarioPermissao.resolveFuncionalidadePermissoes(funcionalidadeIds, input.funcionalidadePermissoes, { ...current, ...input })
      );
    }

    return this.toType(updated);
  }

  async remove(id: number): Promise<boolean> {
    const current = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { id }
    })) as GrupoUsuarioRecord | null;

    if (!current) {
      throw new NotFoundException('Grupo de usuario nao encontrado.');
    }

    assertCanRemoveGrupo(current);

    await (this.prisma as never as { usuario: { updateMany: Function } }).usuario.updateMany({
      where: { grupoId: id },
      data: { grupoId: null }
    });
    await (this.prisma as never as { grupoUsuario: { delete: Function } }).grupoUsuario.delete({ where: { id } });

    return true;
  }

  async toType(grupo: GrupoUsuarioRecord): Promise<GrupoUsuarioType> {
    const access = await this.solucoesService.findGroupAccess(grupo.id);
    return toGrupoUsuarioType(grupo, access);
  }
}
