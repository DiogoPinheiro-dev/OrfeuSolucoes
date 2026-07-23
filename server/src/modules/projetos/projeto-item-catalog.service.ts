import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  AlterarStatusProjetoItemInput,
  VersionarProjetoItemInput
} from './dto/alterar-status-projeto-item.input';
import { CreateProjetoItemInput } from './dto/create-projeto-item.input';
import { ProjetoItemType } from './dto/projeto-item.type';
import { UpdateProjetoItemInput } from './dto/update-projeto-item.input';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';
import { ProjetoItemHierarquiaService } from './projeto-item-hierarquia.service';
import { ProjetoItemQueryService } from './projeto-item-query.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoSequenciaService } from './projeto-sequencia.service';
import {
  normalizeCalendarDate,
  validatePlannedDates
} from './policies/projeto-input.policy';
import { assertProjetoItemStatusTransition } from './policies/projeto-item-status.policy';
import {
  ProjetoItemPrioridade,
  ProjetoItemStatus
} from './types/projeto-item.types';

@Injectable()
export class ProjetoItemCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoItemAuthorizationService,
    private readonly auditoriaService: ProjetoAuditoriaService,
    private readonly hierarquiaService: ProjetoItemHierarquiaService,
    private readonly periodoService: ProjetoPeriodoService,
    private readonly queryService: ProjetoItemQueryService,
    private readonly sequenciaService: ProjetoSequenciaService
  ) {}

  async create(
    input: CreateProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    const contexto = await this.authorization.assertCreateContext(
      input.projetoId,
      user
    );
    const titulo = this.normalizeTitulo(input.titulo);
    const descricao = this.normalizeOptionalText(input.descricao);
    const inicioPrevistoEm = normalizeCalendarDate(input.inicioPrevistoEm);
    const fimPrevistoEm = normalizeCalendarDate(input.fimPrevistoEm);
    validatePlannedDates(inicioPrevistoEm, fimPrevistoEm);
    const estimativaMinutos = input.estimativaMinutos === undefined ||
      input.estimativaMinutos === null
      ? null
      : this.periodoService.assertDuracaoMinutos(input.estimativaMinutos);
    const status = input.status ?? ProjetoItemStatus.ABERTO;
    const prioridade = input.prioridade ?? ProjetoItemPrioridade.MEDIA;

    const id = await this.prisma.$transaction(async (tx) => {
      await Promise.all([
        this.hierarquiaService.assertPaiValido(
          tx,
          contexto.projeto.id,
          input.paiId
        ),
        this.authorization.assertResponsavelElegivel(
          tx,
          contexto,
          input.responsavelId
        )
      ]);
      const numero = await this.sequenciaService.reservar(
        tx,
        contexto.projeto.id,
        'ITEM'
      );
      const item = await tx.projetoItem.create({
        data: {
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id,
          numero,
          chave: `${contexto.projeto.chave}-${numero}`,
          ordemBacklog: numero,
          tipo: input.tipo,
          titulo,
          descricao,
          status,
          prioridade,
          responsavelId: input.responsavelId ?? null,
          autorId: user.sub,
          paiId: input.paiId ?? null,
          inicioPrevistoEm,
          fimPrevistoEm,
          estimativaMinutos,
          concluidoEm:
            status === ProjetoItemStatus.CONCLUIDO ? new Date() : null
        }
      });
      await tx.projeto.update({
        where: { id: contexto.projeto.id },
        data: { backlogVersao: { increment: 1 } }
      });
      await this.auditoriaService.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: item.id,
        evento: 'CRIADO',
        dados: {
          chave: item.chave,
          tipo: item.tipo,
          status: item.status,
          prioridade: item.prioridade
        }
      });

      if (status === ProjetoItemStatus.CONCLUIDO) {
        await this.auditoriaService.registrar(tx, {
          empresaId: contexto.empresaId,
          projetoId: contexto.projeto.id,
          usuarioId: user.sub,
          entidade: 'ITEM',
          entidadeId: item.id,
          evento: 'CONCLUIDO'
        });
      }

      return item.id;
    });

    return this.queryService.findOne(id, user);
  }

  async update(
    input: UpdateProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    const current = await this.findReference(input.id);
    const contexto = await this.authorization.assertEditContext(
      current.projetoId,
      user
    );
    this.assertItemWritable(current);
    const inicioPrevistoEm = input.inicioPrevistoEm === undefined
      ? current.inicioPrevistoEm
      : normalizeCalendarDate(input.inicioPrevistoEm);
    const fimPrevistoEm = input.fimPrevistoEm === undefined
      ? current.fimPrevistoEm
      : normalizeCalendarDate(input.fimPrevistoEm);
    validatePlannedDates(inicioPrevistoEm, fimPrevistoEm);
    const estimativaMinutos = input.estimativaMinutos === undefined
      ? current.estimativaMinutos
      : input.estimativaMinutos === null
        ? null
        : this.periodoService.assertDuracaoMinutos(input.estimativaMinutos);

    await this.prisma.$transaction(async (tx) => {
      if (input.paiId !== undefined) {
        await this.hierarquiaService.assertPaiValido(
          tx,
          contexto.projeto.id,
          input.paiId,
          current.id
        );
      }

      if (input.responsavelId !== undefined) {
        await this.authorization.assertResponsavelElegivel(
          tx,
          contexto,
          input.responsavelId
        );
      }

      await this.updateVersioned(tx, current.id, input.versao, {
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.titulo !== undefined
          ? { titulo: this.normalizeTitulo(input.titulo) }
          : {}),
        ...(input.descricao !== undefined
          ? { descricao: this.normalizeOptionalText(input.descricao) }
          : {}),
        ...(input.prioridade !== undefined
          ? { prioridade: input.prioridade }
          : {}),
        ...(input.responsavelId !== undefined
          ? { responsavelId: input.responsavelId }
          : {}),
        ...(input.paiId !== undefined ? { paiId: input.paiId } : {}),
        ...(input.inicioPrevistoEm !== undefined ? { inicioPrevistoEm } : {}),
        ...(input.fimPrevistoEm !== undefined ? { fimPrevistoEm } : {}),
        ...(input.estimativaMinutos !== undefined
          ? { estimativaMinutos }
          : {})
      });
      await this.auditoriaService.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: current.id,
        evento: 'ALTERADO',
        dados: { versaoAnterior: input.versao }
      });
    });

    return this.queryService.findOne(current.id, user);
  }

  async alterarStatus(
    input: AlterarStatusProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    const current = await this.findReference(input.id);
    const contexto = await this.authorization.assertStatusContext(
      current.projetoId,
      user
    );
    this.assertItemWritable(current);
    const statusAtual = current.status as ProjetoItemStatus;
    assertProjetoItemStatusTransition(statusAtual, input.status);

    if (statusAtual === input.status) {
      if (current.versao !== input.versao) this.throwConflict();
      return this.queryService.findOne(current.id, user);
    }

    await this.prisma.$transaction(async (tx) => {
      await this.updateVersioned(tx, current.id, input.versao, {
        status: input.status,
        concluidoEm:
          input.status === ProjetoItemStatus.CONCLUIDO ? new Date() : null
      });
      await this.auditoriaService.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: current.id,
        evento:
          input.status === ProjetoItemStatus.CONCLUIDO
            ? 'CONCLUIDO'
            : 'STATUS_ALTERADO',
        dados: { de: statusAtual, para: input.status }
      });
    });

    return this.queryService.findOne(current.id, user);
  }

  async arquivar(
    input: VersionarProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    const current = await this.findReference(input.id);
    const contexto = await this.authorization.assertArchiveContext(
      current.projetoId,
      user
    );

    if (current.arquivadoEm) {
      throw new BadRequestException('O item ja esta arquivado.');
    }

    await this.prisma.$transaction(async (tx) => {
      const subtarefasAtivas = await tx.projetoItem.count({
        where: { paiId: current.id, arquivadoEm: null }
      });

      if (subtarefasAtivas) {
        throw new BadRequestException(
          'Arquive as subtarefas antes de arquivar o item pai.'
        );
      }

      await this.updateVersioned(tx, current.id, input.versao, {
        arquivadoEm: new Date(),
        arquivadoPorId: user.sub
      });
      await tx.projeto.update({
        where: { id: contexto.projeto.id },
        data: { backlogVersao: { increment: 1 } }
      });
      await this.auditoriaService.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: current.id,
        evento: 'ARQUIVADO'
      });
    });

    return this.queryService.findOne(current.id, user);
  }

  async reativar(
    input: VersionarProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    const current = await this.findReference(input.id);
    const contexto = await this.authorization.assertReactivateContext(
      current.projetoId,
      user
    );

    if (!current.arquivadoEm) {
      throw new BadRequestException('O item nao esta arquivado.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.hierarquiaService.assertPaiValido(
        tx,
        contexto.projeto.id,
        current.paiId,
        current.id
      );
      await this.updateVersioned(tx, current.id, input.versao, {
        arquivadoEm: null,
        arquivadoPorId: null
      });
      await tx.projeto.update({
        where: { id: contexto.projeto.id },
        data: { backlogVersao: { increment: 1 } }
      });
      await this.auditoriaService.registrar(tx, {
        empresaId: contexto.empresaId,
        projetoId: contexto.projeto.id,
        usuarioId: user.sub,
        entidade: 'ITEM',
        entidadeId: current.id,
        evento: 'REATIVADO'
      });
    });

    return this.queryService.findOne(current.id, user);
  }

  private assertItemWritable(item: { arquivadoEm: Date | null }): void {
    if (item.arquivadoEm) {
      throw new BadRequestException(
        'O item arquivado esta disponivel somente para consulta.'
      );
    }
  }

  private async findReference(id: string): Promise<{
    id: string;
    projetoId: string;
    status: string;
    versao: number;
    paiId: string | null;
    inicioPrevistoEm: Date | null;
    fimPrevistoEm: Date | null;
    estimativaMinutos: number | null;
    arquivadoEm: Date | null;
  }> {
    const item = await this.prisma.projetoItem.findUnique({
      where: { id },
      select: {
        id: true,
        projetoId: true,
        status: true,
        versao: true,
        paiId: true,
        inicioPrevistoEm: true,
        fimPrevistoEm: true,
        estimativaMinutos: true,
        arquivadoEm: true
      }
    });

    if (!item) {
      throw new NotFoundException('Item de projeto nao encontrado.');
    }

    return item;
  }

  private async updateVersioned(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    data: Prisma.ProjetoItemUncheckedUpdateManyInput
  ): Promise<void> {
    const result = await tx.projetoItem.updateMany({
      where: { id, versao },
      data: {
        ...data,
        versao: { increment: 1 }
      }
    });

    if (result.count !== 1) this.throwConflict();
  }

  private throwConflict(): never {
    throw new ConflictException(
      'O item foi alterado por outra pessoa. Atualize os dados e tente novamente.'
    );
  }

  private normalizeTitulo(value: string): string {
    const titulo = value.trim();

    if (!titulo) {
      throw new BadRequestException('O titulo do item e obrigatorio.');
    }

    return titulo;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
