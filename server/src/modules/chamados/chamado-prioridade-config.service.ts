import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES } from './constants/chamado.constants';
import { CreateChamadoPrioridadeInput, UpdateChamadoPrioridadeInput } from './dto/chamado-prioridade.input';
import { ChamadoPrioridadeType } from './dto/chamado-prioridade.type';
import { toPrioridadeType } from './mappers/chamado.mapper';
import { ChamadoConfiguracaoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoPrioridadeConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async prioridadesChamado(user: JwtPayload, ativas = true): Promise<ChamadoPrioridadeType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

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

  private async ensurePrioridadeRecord(id: number, empresaId: number): Promise<ChamadoConfiguracaoRecord> {
    const prioridade = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
      where: { id, empresaId }
    }) as ChamadoConfiguracaoRecord | null;

    if (!prioridade) {
      throw new NotFoundException('Prioridade de chamado nao encontrada.');
    }

    return prioridade;
  }

  private buildConfiguracaoData(empresaId: number, input: CreateChamadoPrioridadeInput) {
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

  private buildConfiguracaoUpdateData(input: UpdateChamadoPrioridadeInput) {
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
