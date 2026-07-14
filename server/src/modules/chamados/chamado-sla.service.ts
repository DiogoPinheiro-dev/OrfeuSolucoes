import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChamadoNotificacaoService } from './chamado-notificacao.service';
import { ChamadoSlaConfigService } from './chamado-sla-config.service';
import { SLA_STATUS } from './constants/chamado.constants';
import { ChamadoRecord, ChamadoSlaRegraRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoSlaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chamadoSlaConfig: ChamadoSlaConfigService,
    private readonly notificacao: ChamadoNotificacaoService
  ) {}

  async buildSlaSnapshot(empresaId: number, prioridadeId: number, referenciaEm: Date = new Date()) {
    const regra = await this.chamadoSlaConfig.findRegraAtivaPorPrioridade(empresaId, prioridadeId);
    return this.buildSnapshotFromRule(regra, referenciaEm);
  }

  async buildPriorityChangeSnapshot(chamado: ChamadoRecord, prioridadeId: number, referenciaEm: Date = new Date()) {
    const regra = await this.chamadoSlaConfig.findRegraAtivaPorPrioridade(chamado.empresaId, prioridadeId);
    const snapshot = this.buildSnapshotFromRule(regra, referenciaEm, chamado.primeiraRespostaEm ?? null);

    if (!regra) {
      return snapshot;
    }

    return {
      ...snapshot,
      slaPausadoEm: chamado.status === 'PENDENTE' ? referenciaEm : null,
      slaStatus: chamado.status === 'PENDENTE' ? 'PAUSADO' as const : snapshot.slaStatus
    };
  }

  buildFirstResponseData(chamado: ChamadoRecord, respondidoEm: Date = new Date()) {
    const respondidoComAtraso = !!chamado.primeiraRespostaLimiteEm
      && respondidoEm.getTime() > chamado.primeiraRespostaLimiteEm.getTime();

    return {
      primeiraRespostaEm: respondidoEm,
      slaStatus: respondidoComAtraso
        ? 'ATRASADO' as const
        : this.calculateSlaStatus({ ...chamado, primeiraRespostaEm: respondidoEm }, respondidoEm)
    };
  }

  buildResolutionData(chamado: ChamadoRecord, resolvidoEm: Date = new Date()) {
    const resumeData = this.buildResumeData(chamado, resolvidoEm);
    const resolvedSnapshot = { ...chamado, ...resumeData };

    return {
      ...resumeData,
      resolvidoEm,
      slaPausadoEm: null,
      slaStatus: this.isResolutionLate(resolvedSnapshot, resolvidoEm) ? 'ATRASADO' as const : 'NO_PRAZO' as const
    };
  }

  buildReopenData(chamado: ChamadoRecord, reabertoEm: Date = new Date()) {
    return {
      resolvidoEm: null,
      slaStatus: this.calculateSlaStatus({ ...chamado, resolvidoEm: null }, reabertoEm)
    };
  }

  buildPauseData(chamado: ChamadoRecord, pausadoEm: Date = new Date()) {
    if (!chamado.slaRegraId || chamado.slaPausadoEm) {
      return {};
    }

    return { slaPausadoEm: pausadoEm, slaStatus: 'PAUSADO' as const };
  }

  buildResumeData(chamado: ChamadoRecord, retomadoEm: Date = new Date()) {
    if (!chamado.slaPausadoEm) {
      return {};
    }

    const pausaMinutos = Math.max(0, Math.ceil((retomadoEm.getTime() - chamado.slaPausadoEm.getTime()) / 60000));
    const primeiraRespostaLimiteEm = chamado.primeiraRespostaEm
      ? chamado.primeiraRespostaLimiteEm ?? null
      : this.shiftDate(chamado.primeiraRespostaLimiteEm, pausaMinutos);
    const resolucaoLimiteEm = this.shiftDate(chamado.resolucaoLimiteEm, pausaMinutos);
    const resumed = {
      ...chamado,
      primeiraRespostaLimiteEm,
      resolucaoLimiteEm,
      slaPausadoEm: null
    };

    return {
      primeiraRespostaLimiteEm,
      resolucaoLimiteEm,
      slaPausadoEm: null,
      slaTempoPausadoMinutos: (chamado.slaTempoPausadoMinutos ?? 0) + pausaMinutos,
      slaStatus: this.calculateSlaStatus(resumed, retomadoEm)
    };
  }

  async refreshOpenSlaStatuses(referenciaEm: Date = new Date()): Promise<number> {
    const chamados = await this.prisma.chamado.findMany({
      where: {
        status: { in: ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE'] },
        slaRegraId: { not: null }
      },
      include: { slaRegra: true }
    }) as unknown as ChamadoRecord[];

    let atualizados = 0;
    for (const chamado of chamados) {
      const slaStatus = this.calculateSlaStatus(chamado, referenciaEm);
      if (slaStatus !== chamado.slaStatus) {
        await this.prisma.chamado.update({ where: { id: chamado.id }, data: { slaStatus } });
        if (slaStatus === 'PERTO_DO_VENCIMENTO' || slaStatus === 'ATRASADO') {
          await this.notificacao.notifySla(chamado, slaStatus);
        }
        atualizados += 1;
      }
    }

    return atualizados;
  }

  calculateSlaStatus(
    chamado: {
      primeiraRespostaEm?: Date | null;
      primeiraRespostaLimiteEm?: Date | null;
      resolvidoEm?: Date | null;
      resolucaoLimiteEm?: Date | null;
      slaPausadoEm?: Date | null;
      regra?: Pick<ChamadoSlaRegraRecord, 'primeiraRespostaPrazoMinutos' | 'resolucaoPrazoMinutos'> | null;
      slaRegra?: Pick<ChamadoSlaRegraRecord, 'primeiraRespostaPrazoMinutos' | 'resolucaoPrazoMinutos'> | null;
    },
    referenciaEm: Date = new Date()
  ): typeof SLA_STATUS[number] {
    if (chamado.slaPausadoEm) return 'PAUSADO';
    if (chamado.primeiraRespostaEm && chamado.primeiraRespostaLimiteEm
      && chamado.primeiraRespostaEm.getTime() > chamado.primeiraRespostaLimiteEm.getTime()) return 'ATRASADO';

    const regra = chamado.regra ?? chamado.slaRegra;
    const prazoAtivo = chamado.primeiraRespostaEm
      ? chamado.resolucaoLimiteEm ?? null
      : chamado.primeiraRespostaLimiteEm ?? chamado.resolucaoLimiteEm ?? null;
    const prazoTotalMinutos = chamado.primeiraRespostaEm
      ? regra?.resolucaoPrazoMinutos ?? 0
      : regra?.primeiraRespostaPrazoMinutos ?? regra?.resolucaoPrazoMinutos ?? 0;

    if (!prazoAtivo) return 'SEM_SLA';

    const restanteMinutos = Math.ceil((prazoAtivo.getTime() - referenciaEm.getTime()) / 60000);
    if (restanteMinutos < 0) return 'ATRASADO';

    const alertaMinutos = Math.max(60, Math.ceil(prazoTotalMinutos * 0.1));
    return restanteMinutos <= alertaMinutos ? 'PERTO_DO_VENCIMENTO' : 'NO_PRAZO';
  }

  private buildSnapshotFromRule(regra: ChamadoSlaRegraRecord | null, referenciaEm: Date, primeiraRespostaEm: Date | null = null) {
    if (!regra) {
      return {
        slaRegraId: null,
        primeiraRespostaLimiteEm: null,
        resolucaoLimiteEm: null,
        slaPausadoEm: null,
        slaTempoPausadoMinutos: 0,
        slaStatus: 'SEM_SLA' as const
      };
    }

    const primeiraRespostaLimiteEm = this.addSlaMinutes(referenciaEm, regra.primeiraRespostaPrazoMinutos, regra.modoContagem);
    const resolucaoLimiteEm = this.addSlaMinutes(referenciaEm, regra.resolucaoPrazoMinutos, regra.modoContagem);

    return {
      slaRegraId: regra.id,
      primeiraRespostaLimiteEm,
      resolucaoLimiteEm,
      slaPausadoEm: null,
      slaTempoPausadoMinutos: 0,
      slaStatus: this.calculateSlaStatus({ primeiraRespostaEm, primeiraRespostaLimiteEm, resolucaoLimiteEm, regra }, referenciaEm)
    };
  }

  private isResolutionLate(chamado: ChamadoRecord, resolvidoEm: Date): boolean {
    const primeiraRespostaAtrasada = !!chamado.primeiraRespostaEm && !!chamado.primeiraRespostaLimiteEm
      && chamado.primeiraRespostaEm.getTime() > chamado.primeiraRespostaLimiteEm.getTime();
    return primeiraRespostaAtrasada || (!!chamado.resolucaoLimiteEm && resolvidoEm.getTime() > chamado.resolucaoLimiteEm.getTime());
  }

  private shiftDate(value: Date | null | undefined, minutos: number): Date | null {
    return value ? new Date(value.getTime() + minutos * 60000) : null;
  }

  private addSlaMinutes(referenciaEm: Date, minutos: number, modoContagem: string): Date {
    return modoContagem === 'UTEIS'
      ? this.addBusinessMinutes(referenciaEm, minutos)
      : new Date(referenciaEm.getTime() + minutos * 60000);
  }

  private addBusinessMinutes(referenciaEm: Date, minutos: number): Date {
    let atual = new Date(referenciaEm);
    let restantes = minutos;
    while (restantes > 0) {
      if (this.isWeekend(atual)) {
        atual = this.moveToNextBusinessDay(atual);
        continue;
      }
      const fimDoDia = new Date(atual);
      fimDoDia.setHours(24, 0, 0, 0);
      const consumidos = Math.min(restantes, Math.ceil((fimDoDia.getTime() - atual.getTime()) / 60000));
      atual = new Date(atual.getTime() + consumidos * 60000);
      restantes -= consumidos;
    }
    return atual;
  }

  private moveToNextBusinessDay(date: Date): Date {
    const atual = new Date(date);
    atual.setHours(0, 0, 0, 0);
    while (this.isWeekend(atual)) atual.setDate(atual.getDate() + 1);
    return atual;
  }

  private isWeekend(date: Date): boolean {
    return [0, 6].includes(date.getDay());
  }
}