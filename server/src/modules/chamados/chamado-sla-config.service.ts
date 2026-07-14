import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES, SLA_MODO_CONTAGEM } from './constants/chamado.constants';
import { CreateChamadoSlaRegraInput, UpdateChamadoSlaRegraInput } from './dto/chamado-sla-regra.input';
import { ChamadoSlaRegraType } from './dto/chamado-sla-regra.type';
import { toChamadoSlaRegraType } from './mappers/chamado.mapper';
import { ChamadoConfiguracaoRecord, ChamadoSlaRegraRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoSlaConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async regrasSlaChamado(user: JwtPayload, ativas = true): Promise<ChamadoSlaRegraType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (!(await this.authorization.canUseAnyChamadosFeature(user))) {
      throw new ForbiddenException('Usuario sem acesso ao controle de chamados.');
    }

    const regras = (await (this.prisma as never as { chamadoSlaRegra: { findMany: Function } }).chamadoSlaRegra.findMany({
      where: { empresaId, ...(ativas ? { ativo: true } : {}) },
      include: { prioridade: true },
      orderBy: [{ ativo: 'desc' }, { prioridade: { ordem: 'asc' } }, { prioridade: { nome: 'asc' } }]
    })) as ChamadoSlaRegraRecord[];

    return regras.map((regra) => toChamadoSlaRegraType(regra));
  }

  async createRegra(input: CreateChamadoSlaRegraInput, user: JwtPayload): Promise<ChamadoSlaRegraType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.sla, 'incluir');

    const prioridade = await this.ensurePrioridadeAtiva(empresaId, input.prioridadeId);
    await this.ensureRegraUnica(empresaId, prioridade.id);

    const created = (await (this.prisma as never as { chamadoSlaRegra: { create: Function } }).chamadoSlaRegra.create({
      data: this.buildCreateData(empresaId, input),
      include: { prioridade: true }
    })) as ChamadoSlaRegraRecord;

    return toChamadoSlaRegraType(created);
  }

  async updateRegra(input: UpdateChamadoSlaRegraInput, user: JwtPayload): Promise<ChamadoSlaRegraType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.sla, 'alterar');
    const regraAtual = await this.ensureRegraRecord(input.id, empresaId);

    const prioridadeId = input.prioridadeId ?? regraAtual.prioridadeId;
    await this.ensurePrioridadeAtiva(empresaId, prioridadeId);

    if (prioridadeId != regraAtual.prioridadeId) {
      await this.ensureRegraUnica(empresaId, prioridadeId, regraAtual.id);
    }

    const updated = (await (this.prisma as never as { chamadoSlaRegra: { update: Function } }).chamadoSlaRegra.update({
      where: { id: input.id },
      data: this.buildUpdateData(input, prioridadeId),
      include: { prioridade: true }
    })) as ChamadoSlaRegraRecord;

    return toChamadoSlaRegraType(updated);
  }

  async deleteRegra(id: number, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.sla, 'excluir');
    await this.ensureRegraRecord(id, empresaId);

    await (this.prisma as never as { chamadoSlaRegra: { update: Function } }).chamadoSlaRegra.update({
      where: { id },
      data: { ativo: false }
    });

    return true;
  }

  async findRegraAtivaPorPrioridade(empresaId: number, prioridadeId: number): Promise<ChamadoSlaRegraRecord | null> {
    return await (this.prisma as never as { chamadoSlaRegra: { findFirst: Function } }).chamadoSlaRegra.findFirst({
      where: { empresaId, prioridadeId, ativo: true },
      include: { prioridade: true }
    }) as ChamadoSlaRegraRecord | null;
  }

  private async ensureRegraRecord(id: number, empresaId: number): Promise<ChamadoSlaRegraRecord> {
    const regra = await (this.prisma as never as { chamadoSlaRegra: { findFirst: Function } }).chamadoSlaRegra.findFirst({
      where: { id, empresaId },
      include: { prioridade: true }
    }) as ChamadoSlaRegraRecord | null;

    if (!regra) {
      throw new NotFoundException('Regra de SLA nao encontrada.');
    }

    return regra;
  }

  private async ensurePrioridadeAtiva(empresaId: number, prioridadeId: number): Promise<ChamadoConfiguracaoRecord> {
    const prioridade = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
      where: { id: prioridadeId, empresaId, ativo: true }
    }) as ChamadoConfiguracaoRecord | null;

    if (!prioridade) {
      throw new BadRequestException('Prioridade de chamado invalida ou inativa.');
    }

    return prioridade;
  }

  private async ensureRegraUnica(empresaId: number, prioridadeId: number, ignoreId?: number): Promise<void> {
    const regraExistente = await (this.prisma as never as { chamadoSlaRegra: { findFirst: Function } }).chamadoSlaRegra.findFirst({
      where: {
        empresaId,
        prioridadeId,
        ...(ignoreId ? { id: { not: ignoreId } } : {})
      },
      select: { id: true }
    }) as { id: number } | null;

    if (regraExistente) {
      throw new BadRequestException('Ja existe uma regra de SLA para esta prioridade na empresa ativa.');
    }
  }

  private buildCreateData(empresaId: number, input: CreateChamadoSlaRegraInput) {
    return {
      empresaId,
      prioridadeId: input.prioridadeId,
      primeiraRespostaPrazoMinutos: input.primeiraRespostaPrazoMinutos,
      resolucaoPrazoMinutos: input.resolucaoPrazoMinutos,
      modoContagem: this.normalizeModoContagem(input.modoContagem),
      ativo: input.ativo ?? true
    };
  }

  private buildUpdateData(input: UpdateChamadoSlaRegraInput, prioridadeId: number) {
    return {
      prioridadeId,
      ...(input.primeiraRespostaPrazoMinutos !== undefined && input.primeiraRespostaPrazoMinutos !== null
        ? { primeiraRespostaPrazoMinutos: input.primeiraRespostaPrazoMinutos }
        : {}),
      ...(input.resolucaoPrazoMinutos !== undefined && input.resolucaoPrazoMinutos !== null
        ? { resolucaoPrazoMinutos: input.resolucaoPrazoMinutos }
        : {}),
      ...(input.modoContagem !== undefined && input.modoContagem !== null
        ? { modoContagem: this.normalizeModoContagem(input.modoContagem) }
        : {}),
      ...(input.ativo !== undefined && input.ativo !== null ? { ativo: input.ativo } : {})
    };
  }

  private normalizeModoContagem(value?: string | null): string {
    const normalized = (value ?? 'CORRIDO')
      .trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!(SLA_MODO_CONTAGEM as readonly string[]).includes(normalized)) {
      throw new BadRequestException('Modo de contagem de SLA invalido.');
    }

    return normalized;
  }
}
