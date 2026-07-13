import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import { CreateChamadoTipoInput, UpdateChamadoTipoInput } from './dto/chamado-tipo.input';
import { ChamadoTipoType } from './dto/chamado-tipo.type';
import { toTipoType } from './mappers/chamado.mapper';
import { ChamadoConfiguracaoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoTipoConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async tiposChamado(user: JwtPayload, ativas = true): Promise<ChamadoTipoType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

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

  private async ensureTipoRecord(id: number, empresaId: number): Promise<ChamadoConfiguracaoRecord> {
    const tipo = await (this.prisma as never as { chamadoTipo: { findFirst: Function } }).chamadoTipo.findFirst({
      where: { id, empresaId }
    }) as ChamadoConfiguracaoRecord | null;

    if (!tipo) {
      throw new NotFoundException('Tipo de chamado nao encontrado.');
    }

    return tipo;
  }

  private buildConfiguracaoData(empresaId: number, input: CreateChamadoTipoInput) {
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

  private buildConfiguracaoUpdateData(input: UpdateChamadoTipoInput) {
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
