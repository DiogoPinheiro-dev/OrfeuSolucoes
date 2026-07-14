import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoGoogleEmailService } from './chamado-google-email.service';
import type { ChamadoHistoricoPayload } from './chamado-history.service';
import { ChamadoNotificacaoType } from './dto/chamado-notificacao.type';
import { ChamadoRecord } from './types/chamado-record.types';

type NotificationPayload = { tipo: string; titulo: string; mensagem: string; eventoChave: string };

@Injectable()
export class ChamadoNotificacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly googleEmail: ChamadoGoogleEmailService
  ) {}

  async listar(user: JwtPayload, limite = 30): Promise<ChamadoNotificacaoType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const rows = await this.prisma.chamadoNotificacao.findMany({
      where: { empresaId, usuarioId: user.sub },
      include: { chamado: true },
      orderBy: { criadoEm: 'desc' },
      take: Math.min(100, Math.max(1, limite))
    });
    return rows.map((row) => ({
      id: row.id, chamadoId: row.chamadoId, chamadoNumero: row.chamado.numero,
      chamadoTitulo: row.chamado.titulo, tipo: row.tipo, titulo: row.titulo,
      mensagem: row.mensagem, lidaEm: row.lidaEm, criadoEm: row.criadoEm
    }));
  }

  async naoLidas(user: JwtPayload): Promise<number> {
    const empresaId = this.authorization.assertCompanyContext(user);
    return this.prisma.chamadoNotificacao.count({ where: { empresaId, usuarioId: user.sub, lidaEm: null } });
  }

  async marcarComoLida(id: string, user: JwtPayload): Promise<boolean> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const result = await this.prisma.chamadoNotificacao.updateMany({
      where: { id, empresaId, usuarioId: user.sub, lidaEm: null }, data: { lidaEm: new Date() }
    });
    return result.count > 0;
  }

  async marcarTodasComoLidas(user: JwtPayload): Promise<number> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const result = await this.prisma.chamadoNotificacao.updateMany({
      where: { empresaId, usuarioId: user.sub, lidaEm: null }, data: { lidaEm: new Date() }
    });
    return result.count;
  }

  async notifyCreated(chamado: ChamadoRecord, actorId: string): Promise<void> {
    await this.notify(chamado.id, actorId, {
      tipo: 'CHAMADO_CRIADO', titulo: 'Chamado #' + chamado.numero + ' criado',
      mensagem: chamado.titulo, eventoChave: chamado.id + ':CRIADO'
    });
    await this.googleEmail.sendChamadoUpdate(chamado.id, 'Chamado #' + chamado.numero + ' criado', chamado.titulo);
  }

  async notifyMessage(chamado: ChamadoRecord, actorId: string): Promise<void> {
    await this.notify(chamado.id, actorId, {
      tipo: 'NOVA_RESPOSTA', titulo: 'Nova resposta no chamado #' + chamado.numero,
      mensagem: chamado.titulo, eventoChave: chamado.id + ':MENSAGEM:' + (chamado.versao + 1)
    });
    await this.googleEmail.sendChamadoUpdate(chamado.id, 'Nova resposta no chamado #' + chamado.numero, 'Uma nova resposta foi adicionada ao chamado.');
  }

  async notifyHistory(chamado: ChamadoRecord, actorId: string, historicos: ChamadoHistoricoPayload[]): Promise<void> {
    for (const historico of historicos) {
      const payload = this.mapHistory(chamado, historico);
      if (payload) await this.notify(chamado.id, actorId, payload);
      const assunto = payload?.titulo || ('Atualizacao no chamado #' + chamado.numero);
      const descricao = payload?.mensagem || [historico.evento, historico.campo, historico.valorNovo, historico.observacao].filter(Boolean).join(' - ');
      await this.googleEmail.sendChamadoUpdate(chamado.id, assunto, descricao || chamado.titulo);
    }
  }

  async notifySla(chamado: ChamadoRecord, slaStatus: 'PERTO_DO_VENCIMENTO' | 'ATRASADO'): Promise<void> {
    const titulo = slaStatus === 'ATRASADO' ? 'SLA atrasado no chamado #' + chamado.numero : 'SLA perto do vencimento no chamado #' + chamado.numero;
    await this.notify(chamado.id, null, {
      tipo: slaStatus === 'ATRASADO' ? 'SLA_ATRASADO' : 'SLA_PERTO_DO_VENCIMENTO',
      titulo: slaStatus === 'ATRASADO'
        ? 'SLA atrasado no chamado #' + chamado.numero
        : 'SLA perto do vencimento no chamado #' + chamado.numero,
      mensagem: chamado.titulo,
      eventoChave: chamado.id + ':SLA:' + slaStatus + ':' + (chamado.resolucaoLimiteEm?.getTime() || chamado.primeiraRespostaLimiteEm?.getTime() || 0)
    });
    await this.googleEmail.sendChamadoUpdate(chamado.id, titulo, chamado.titulo);
  }

  private mapHistory(chamado: ChamadoRecord, historico: ChamadoHistoricoPayload): NotificationPayload | null {
    const configs: Record<string, Omit<NotificationPayload, 'eventoChave'>> = {
      ATRIBUICAO: historico.observacao === 'Chamado assumido pelo atendente.'
        ? { tipo: 'CHAMADO_ASSUMIDO', titulo: 'Chamado #' + chamado.numero + ' assumido', mensagem: historico.valorNovo || chamado.titulo }
        : { tipo: 'RESPONSAVEL_ALTERADO', titulo: 'Responsavel alterado no chamado #' + chamado.numero, mensagem: historico.valorNovo || 'Sem responsavel' },
      TRANSFERENCIA: { tipo: 'RESPONSAVEL_ALTERADO', titulo: 'Responsavel alterado no chamado #' + chamado.numero, mensagem: historico.valorNovo || 'Sem responsavel' },
      LIDERANCA_ATENDIMENTO: { tipo: 'CHAMADO_ASSUMIDO', titulo: 'Chamado #' + chamado.numero + ' assumido', mensagem: historico.valorNovo || chamado.titulo },
      RESOLUCAO: { tipo: 'CHAMADO_RESOLVIDO', titulo: 'Chamado #' + chamado.numero + ' resolvido', mensagem: historico.observacao || chamado.titulo },
      REABERTURA: { tipo: 'CHAMADO_REABERTO', titulo: 'Chamado #' + chamado.numero + ' reaberto', mensagem: historico.observacao || chamado.titulo }
    };
    const config = configs[historico.evento];
    return config ? { ...config, eventoChave: chamado.id + ':' + historico.evento + ':' + (chamado.versao + 1) } : null;
  }

  private async notify(chamadoId: string, actorId: string | null, payload: NotificationPayload): Promise<void> {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id: chamadoId },
      include: {
        acompanhantes: { where: { ativo: true } },
        responsavelGrupo: { include: { usuarios: { include: { empresas: true } } } }
      }
    });
    if (!chamado) return;

    const ids = [
      chamado.solicitanteId, chamado.responsavelId, chamado.liderAtendimentoId,
      ...chamado.acompanhantes.map((item) => item.usuarioId),
      ...(chamado.responsavelGrupo?.usuarios || [])
        .filter((usuario) => usuario.empresas.some((empresa) => empresa.empresaId === chamado.empresaId))
        .map((usuario) => usuario.id)
    ];
    const recipientIds = new Set<string>(ids.filter((id): id is string => !!id && id !== actorId));

    const gestores = await this.prisma.usuario.findMany({
      where: {
        empresas: { some: { empresaId: chamado.empresaId } },
        grupo: { funcionalidades: { some: {
          funcionalidade: { slug: 'painel-atendimento', solucao: { slug: 'controle-de-chamados' } }
        } } }
      },
      select: { id: true }
    });
    gestores.forEach((gestor) => { if (gestor.id !== actorId) recipientIds.add(gestor.id); });

    for (const usuarioId of recipientIds) {
      const eventoChave = payload.eventoChave + ':' + usuarioId;
      await this.prisma.chamadoNotificacao.upsert({
        where: { eventoChave }, update: {},
        create: {
          empresaId: chamado.empresaId, usuarioId, chamadoId, tipo: payload.tipo,
          titulo: payload.titulo, mensagem: payload.mensagem, eventoChave
        }
      });
    }
  }
}