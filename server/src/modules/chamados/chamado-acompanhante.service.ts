import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { usuarioResumoSelect } from './constants/chamado-prisma.constants';
import { FEATURES } from './constants/chamado.constants';
import { ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
import { AtualizarChamadoAcompanhantesInput } from './dto/chamado-acompanhante.input';
import { usuarioLabel } from './mappers/chamado.mapper';
import { isClosedStatus } from './policies/chamado-status.policy';
import { ChamadoAcompanhanteRecord, ChamadoRecord } from './types/chamado-record.types';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Injectable()
export class ChamadoAcompanhanteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly chamadoResponsavel: ChamadoResponsavelService
  ) {}

  async acompanhantesElegiveisChamado(user: JwtPayload, chamadoId?: string | null): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);

    if (chamadoId?.trim()) {
      const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId.trim(), empresaId);
      await this.authorization.assertCanViewChamado(user, chamado);

      return this.chamadoResponsavel.findUsuariosElegiveisAcompanhantes(empresaId, {
        solicitanteId: chamado.solicitanteId,
        responsavelId: chamado.responsavelId ?? null
      });
    }

    await this.authorization.assertFeatureAction(user, FEATURES.abrir, 'incluir');

    return this.chamadoResponsavel.findUsuariosElegiveisAcompanhantes(empresaId, {
      solicitanteId: user.sub,
      responsavelId: null
    });
  }

  async resolveAcompanhantesPayload(
    empresaId: number,
    usuarioIds: string[] | null | undefined,
    contexto: { solicitanteId?: string | null; responsavelId?: string | null }
  ): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    return this.chamadoResponsavel.resolveAcompanhantesPayload(empresaId, usuarioIds, contexto);
  }
  async atualizarAcompanhantesChamado(input: AtualizarChamadoAcompanhantesInput, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);

    await this.authorization.assertCanManageAcompanhantes(user, chamado);

    if (isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamados arquivados precisam ser desarquivados antes de alterar acompanhantes.');
    }

    const acompanhantes = await this.chamadoResponsavel.resolveAcompanhantesPayload(empresaId, input.usuarioIds ?? [], {
      solicitanteId: chamado.solicitanteId,
      responsavelId: chamado.responsavelId ?? null
    });
    const nextIds = new Set(acompanhantes.map((acompanhante) => acompanhante.id));
    const existing = (await (this.prisma as never as { chamadoAcompanhante: { findMany: Function } }).chamadoAcompanhante.findMany({
      where: { chamadoId: chamado.id, empresaId },
      include: { usuario: { select: usuarioResumoSelect }, adicionadoPor: { select: usuarioResumoSelect } }
    })) as ChamadoAcompanhanteRecord[];
    const existingByUser = new Map(existing.map((item) => [item.usuarioId, item]));
    const active = existing.filter((item) => item.ativo);
    const toDeactivate = active.filter((item) => !nextIds.has(item.usuarioId));
    const toActivateOrCreate = acompanhantes.filter((item) => !existingByUser.get(item.id)?.ativo);
    const now = new Date();

    if (!toDeactivate.length && !toActivateOrCreate.length) {
      return chamado.id;
    }

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamado: { update: Function };
        chamadoAcompanhante: { update: Function; updateMany: Function; create: Function };
        chamadoHistorico: { create: Function };
      };

      if (toDeactivate.length) {
        await db.chamadoAcompanhante.updateMany({
          where: { chamadoId: chamado.id, empresaId, usuarioId: { in: toDeactivate.map((item) => item.usuarioId) } },
          data: { ativo: false, atualizadoEm: now }
        });
      }

      for (const acompanhante of toActivateOrCreate) {
        const previous = existingByUser.get(acompanhante.id);

        if (previous) {
          await db.chamadoAcompanhante.update({
            where: { id: previous.id },
            data: { ativo: true, adicionadoPorId: user.sub, atualizadoEm: now }
          });
        } else {
          await db.chamadoAcompanhante.create({
            data: {
              chamadoId: chamado.id,
              empresaId,
              usuarioId: acompanhante.id,
              adicionadoPorId: user.sub,
              ativo: true
            }
          });
        }
      }

      await db.chamado.update({
        where: { id: chamado.id },
        data: { versao: { increment: 1 } }
      });

      if (toActivateOrCreate.length) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorNovo: toActivateOrCreate.map((acompanhante) => usuarioLabel(acompanhante)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes adicionados ao chamado.'
          }
        });
      }

      if (toDeactivate.length) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorAnterior: toDeactivate.map((acompanhante) => usuarioLabel(acompanhante.usuario)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes removidos do chamado.'
          }
        });
      }
    });

    return chamado.id;
  }

  async desativarAcompanhantesDoChamado(
    chamado: ChamadoRecord,
    user: JwtPayload,
    usuarioIds: string[],
    observacao: string
  ): Promise<void> {
    const ids = [...new Set(usuarioIds.filter(Boolean))];

    if (!ids.length) {
      return;
    }

    const ativos = (await (this.prisma as never as { chamadoAcompanhante: { findMany: Function } }).chamadoAcompanhante.findMany({
      where: { chamadoId: chamado.id, empresaId: chamado.empresaId, usuarioId: { in: ids }, ativo: true },
      include: { usuario: { select: usuarioResumoSelect } }
    })) as ChamadoAcompanhanteRecord[];

    if (!ativos.length) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as { chamado: { update: Function }; chamadoAcompanhante: { updateMany: Function }; chamadoHistorico: { create: Function } };

      await db.chamadoAcompanhante.updateMany({
        where: { chamadoId: chamado.id, empresaId: chamado.empresaId, usuarioId: { in: ativos.map((item) => item.usuarioId) }, ativo: true },
        data: { ativo: false, atualizadoEm: new Date() }
      });

      await db.chamado.update({
        where: { id: chamado.id },
        data: { versao: { increment: 1 } }
      });

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId: chamado.empresaId,
          usuarioId: user.sub,
          evento: 'ACOMPANHANTES',
          campo: 'acompanhantes',
          valorAnterior: ativos.map((item) => usuarioLabel(item.usuario)).filter(Boolean).join(', '),
          observacao
        }
      });
    });
  }
}
