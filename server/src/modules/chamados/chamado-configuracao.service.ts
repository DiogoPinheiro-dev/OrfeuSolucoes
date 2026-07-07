import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from '../solucoes/solucoes.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoPrioridadeInput, UpdateChamadoPrioridadeInput } from './dto/chamado-prioridade.input';
import { ChamadoPrioridadeType } from './dto/chamado-prioridade.type';
import { CreateChamadoTipoInput, UpdateChamadoTipoInput } from './dto/chamado-tipo.input';
import { ChamadoTipoType } from './dto/chamado-tipo.type';
import { toCategoriaType, toPrioridadeType, toTipoType } from './mappers/chamado.mapper';
import { ChamadoCategoriaRecord, ChamadoConfiguracaoRecord } from './types/chamado-record.types';

type ConfiguracaoCreateInput = {
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  ordem?: number;
  ativo?: boolean;
};

type ConfiguracaoUpdateInput = {
  nome?: string | null;
  descricao?: string | null;
  cor?: string | null;
  ordem?: number | null;
  ativo?: boolean | null;
};

@Injectable()
export class ChamadoConfiguracaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async categoriasChamado(user: JwtPayload, ativas = true): Promise<ChamadoCategoriaType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    const categorias = (await (this.prisma as never as { chamadoCategoria: { findMany: Function } }).chamadoCategoria.findMany({
      where: {
        empresaId,
        ...(ativas ? { ativo: true } : {})
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }]
    })) as ChamadoCategoriaRecord[];

    return categorias.map((categoria) => toCategoriaType(categoria));
  }

  async createCategoria(input: CreateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.categorias, 'incluir');

    const created = (await (this.prisma as never as { chamadoCategoria: { create: Function } }).chamadoCategoria.create({
      data: {
        empresaId,
        nome: this.requiredText(input.nome, 'nome'),
        descricao: input.descricao?.trim() || null,
        ativo: input.ativo ?? true
      }
    })) as ChamadoCategoriaRecord;

    return toCategoriaType(created);
  }

  async updateCategoria(input: UpdateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.categorias, 'alterar');
    await this.ensureCategoria(input.id, empresaId, false);

    const updated = (await (this.prisma as never as { chamadoCategoria: { update: Function } }).chamadoCategoria.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: this.requiredText(input.nome ?? '', 'nome') } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
      }
    })) as ChamadoCategoriaRecord;

    return toCategoriaType(updated);
  }

  async deleteCategoria(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.categorias, 'excluir');
    await this.ensureCategoria(id, empresaId, false);

    await (this.prisma as never as { chamadoCategoria: { update: Function } }).chamadoCategoria.update({
      where: { id },
      data: { ativo: false }
    });

    return true;
  }

  async tiposChamado(user: JwtPayload, ativas = true): Promise<ChamadoTipoType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    await this.ensureDefaultChamadoConfiguracoes(empresaId);

    const tipos = (await (this.prisma as never as { chamadoTipo: { findMany: Function } }).chamadoTipo.findMany({
      where: { empresaId, ...(ativas ? { ativo: true } : {}) },
      orderBy: [{ ativo: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }]
    })) as ChamadoConfiguracaoRecord[];

    return tipos.map((tipo) => toTipoType(tipo));
  }

  async createTipo(input: CreateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.tipos, 'incluir');

    const created = (await (this.prisma as never as { chamadoTipo: { create: Function } }).chamadoTipo.create({
      data: this.buildConfiguracaoData(empresaId, input)
    })) as ChamadoConfiguracaoRecord;

    return toTipoType(created);
  }

  async updateTipo(input: UpdateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.tipos, 'alterar');
    await this.ensureTipoRecord(input.id, empresaId);

    const updated = (await (this.prisma as never as { chamadoTipo: { update: Function } }).chamadoTipo.update({
      where: { id: input.id },
      data: this.buildConfiguracaoUpdateData(input)
    })) as ChamadoConfiguracaoRecord;

    return toTipoType(updated);
  }

  async deleteTipo(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.tipos, 'excluir');
    await this.ensureTipoRecord(id, empresaId);

    await (this.prisma as never as { chamadoTipo: { update: Function } }).chamadoTipo.update({
      where: { id },
      data: { ativo: false }
    });

    return true;
  }

  async prioridadesChamado(user: JwtPayload, ativas = true): Promise<ChamadoPrioridadeType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    await this.ensureDefaultChamadoConfiguracoes(empresaId);

    const prioridades = (await (this.prisma as never as { chamadoPrioridade: { findMany: Function } }).chamadoPrioridade.findMany({
      where: { empresaId, ...(ativas ? { ativo: true } : {}) },
      orderBy: [{ ativo: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }]
    })) as ChamadoConfiguracaoRecord[];

    return prioridades.map((prioridade) => toPrioridadeType(prioridade));
  }

  async createPrioridade(input: CreateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.prioridades, 'incluir');

    const created = (await (this.prisma as never as { chamadoPrioridade: { create: Function } }).chamadoPrioridade.create({
      data: this.buildConfiguracaoData(empresaId, input)
    })) as ChamadoConfiguracaoRecord;

    return toPrioridadeType(created);
  }

  async updatePrioridade(input: UpdateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.prioridades, 'alterar');
    await this.ensurePrioridadeRecord(input.id, empresaId);

    const updated = (await (this.prisma as never as { chamadoPrioridade: { update: Function } }).chamadoPrioridade.update({
      where: { id: input.id },
      data: this.buildConfiguracaoUpdateData(input)
    })) as ChamadoConfiguracaoRecord;

    return toPrioridadeType(updated);
  }

  async deletePrioridade(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.prioridades, 'excluir');
    await this.ensurePrioridadeRecord(id, empresaId);

    await (this.prisma as never as { chamadoPrioridade: { update: Function } }).chamadoPrioridade.update({
      where: { id },
      data: { ativo: false }
    });

    return true;
  }

  async ensureDefaultChamadoConfiguracoes(empresaId: number): Promise<void> {
    await this.solucoesService.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId, true);
  }

  async ensureTipoChamado(empresaId: number, id: number | null | undefined): Promise<ChamadoConfiguracaoRecord> {
    if (!id || !Number.isInteger(Number(id))) {
      throw new BadRequestException('Selecione o tipo de chamado.');
    }

    const tipo = await (this.prisma as never as { chamadoTipo: { findFirst: Function } }).chamadoTipo.findFirst({
      where: { id: Number(id), empresaId, ativo: true }
    }) as ChamadoConfiguracaoRecord | null;

    if (!tipo) {
      throw new BadRequestException('Tipo de chamado invalido ou inativo.');
    }

    return tipo;
  }

  async ensurePrioridadeChamado(empresaId: number, id: number | null | undefined): Promise<ChamadoConfiguracaoRecord> {
    if (!id || !Number.isInteger(Number(id))) {
      throw new BadRequestException('Selecione a prioridade do chamado.');
    }

    const prioridade = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
      where: { id: Number(id), empresaId, ativo: true }
    }) as ChamadoConfiguracaoRecord | null;

    if (!prioridade) {
      throw new BadRequestException('Prioridade de chamado invalida ou inativa.');
    }

    return prioridade;
  }

  async ensureCategoria(id: number, empresaId: number, requireActive: boolean): Promise<ChamadoCategoriaRecord> {
    const categoria = (await (this.prisma as never as { chamadoCategoria: { findFirst: Function } }).chamadoCategoria.findFirst({
      where: {
        id,
        empresaId,
        ...(requireActive ? { ativo: true } : {})
      }
    })) as ChamadoCategoriaRecord | null;

    if (!categoria) {
      throw new NotFoundException('Categoria de chamado nao encontrada.');
    }

    return categoria;
  }

  private async ensureTipoRecord(id: number, empresaId: number): Promise<ChamadoConfiguracaoRecord> {
    const tipo = await (this.prisma as never as { chamadoTipo: { findFirst: Function } }).chamadoTipo.findFirst({
      where: { id, empresaId }
    }) as ChamadoConfiguracaoRecord | null;

    if (!tipo) {
      throw new NotFoundException('Tipo de chamado nao encontrado.');
    }

    return tipo;
  }

  private async ensurePrioridadeRecord(id: number, empresaId: number): Promise<ChamadoConfiguracaoRecord> {
    const prioridade = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
      where: { id, empresaId }
    }) as ChamadoConfiguracaoRecord | null;

    if (!prioridade) {
      throw new NotFoundException('Prioridade de chamado nao encontrada.');
    }

    return prioridade;
  }

  private buildConfiguracaoData(empresaId: number, input: ConfiguracaoCreateInput) {
    const nome = this.requiredText(input.nome, 'nome');

    return {
      empresaId,
      nome,
      descricao: input.descricao?.trim() || null,
      cor: input.cor?.trim() || null,
      ordem: input.ordem ?? 0,
      ativo: input.ativo ?? true
    };
  }

  private buildConfiguracaoUpdateData(input: ConfiguracaoUpdateInput) {
    return {
      ...(input.nome !== undefined ? { nome: this.requiredText(input.nome ?? '', 'nome') } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
      ...(input.cor !== undefined ? { cor: input.cor?.trim() || null } : {}),
      ...(input.ordem !== undefined && input.ordem !== null ? { ordem: input.ordem } : {}),
      ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
    };
  }

  private requiredText(value: string, fieldName: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`Preencha ${fieldName}.`);
    }

    return normalized;
  }
}
