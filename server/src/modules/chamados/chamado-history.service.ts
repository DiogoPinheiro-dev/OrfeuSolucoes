import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoNotificacaoService } from './chamado-notificacao.service';
import { ChamadoRecord } from './types/chamado-record.types';

export type ChamadoHistoricoPayload = {
  evento: string;
  campo?: string | null;
  valorAnterior?: string | null;
  valorNovo?: string | null;
  observacao?: string | null;
};

@Injectable()
export class ChamadoHistoryService {
  constructor(private readonly prisma: PrismaService, private readonly notificacao: ChamadoNotificacaoService) {}

  async updateChamadoWithHistory(
    chamado: ChamadoRecord,
    user: JwtPayload,
    data: Record<string, unknown>,
    historico: ChamadoHistoricoPayload[]
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as { chamado: { update: Function }; chamadoHistorico: { create: Function } };

      await db.chamado.update({
        where: { id: chamado.id },
        data
      });

      for (const item of historico) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId: chamado.empresaId,
            usuarioId: user.sub,
            evento: item.evento,
            campo: item.campo ?? null,
            valorAnterior: item.valorAnterior ?? null,
            valorNovo: item.valorNovo ?? null,
            observacao: item.observacao ?? null
          }
        });
      }
    });

    await this.notificacao.notifyHistory(chamado, user.sub, historico);
  }

  async updateStatus(
    chamado: ChamadoRecord,
    user: JwtPayload,
    status: string,
    observacao?: string | null,
    extraData: Record<string, unknown> = {}
  ): Promise<void> {
    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        status,
        ...extraData,
        versao: { increment: 1 }
      },
      [{
        evento: status === 'RESOLVIDO'
          ? 'RESOLUCAO'
          : status === 'ARQUIVADO'
            ? 'ARQUIVAMENTO'
            : 'ALTERACAO_STATUS',
        campo: 'status',
        valorAnterior: chamado.status,
        valorNovo: status,
        observacao: observacao?.trim() || null
      }]
    );
  }
}
