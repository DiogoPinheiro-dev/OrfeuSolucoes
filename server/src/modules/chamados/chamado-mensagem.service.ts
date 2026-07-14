import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ResponderChamadoInput } from './dto/responder-chamado.input';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoNotificacaoService } from './chamado-notificacao.service';
import { ChamadoSlaService } from './chamado-sla.service';
import { isClosedStatus } from './policies/chamado-status.policy';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Injectable()
export class ChamadoMensagemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoSla: ChamadoSlaService,
    private readonly notificacao: ChamadoNotificacaoService
  ) {}

  async responderChamado(input: ResponderChamadoInput, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);

    await this.authorization.assertCanRespondChamado(user, chamado);

    if (isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamados arquivados precisam ser reabertos antes de receber novas respostas.');
    }

    const conteudo = this.requiredText(input.conteudo, 'conteudo');
    const isAcompanhante = await this.authorization.isAcompanhanteAtivo(chamado.id, user.sub);
    const isAtendente = chamado.solicitanteId !== user.sub && !isAcompanhante;
    const shouldMarkFirstResponse = isAtendente && !chamado.primeiraRespostaEm;
    const shouldMoveToAttendance = isAtendente && ['ABERTO', 'EM_TRIAGEM'].includes(chamado.status);
    const nextStatus = shouldMoveToAttendance ? 'EM_ATENDIMENTO' : chamado.status;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoMensagem: { create: Function };
        chamado: { update: Function };
        chamadoHistorico: { create: Function };
      };

      await db.chamadoMensagem.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          autorId: user.sub,
          tipo: 'PUBLICA',
          conteudo
        }
      });

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          usuarioId: user.sub,
          evento: 'MENSAGEM',
          observacao: 'Resposta publica adicionada.'
        }
      });

      await db.chamado.update({
        where: { id: chamado.id },
        data: {
          ...(shouldMarkFirstResponse ? this.chamadoSla.buildFirstResponseData(chamado, now) : {}),
          ...(shouldMoveToAttendance ? { status: nextStatus } : {}),
          versao: { increment: 1 }
        }
      });

      if (shouldMoveToAttendance) {
        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ALTERACAO_STATUS',
            campo: 'status',
            valorAnterior: chamado.status,
            valorNovo: nextStatus,
            observacao: 'Status ajustado automaticamente apos resposta do atendimento.'
          }
        });
      }
    });

    await this.notificacao.notifyMessage(chamado, user.sub);

    return chamado.id;
  }

  private requiredText(value: string, fieldName: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`Preencha ${fieldName}.`);
    }

    return normalized;
  }
}
