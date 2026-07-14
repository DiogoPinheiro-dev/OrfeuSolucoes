import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES, OPEN_STATUSES } from './constants/chamado.constants';
import { ChamadoDashboardSerieType, ChamadoDashboardType } from './dto/chamado-dashboard.type';

type DashboardRow = {
  status: string; slaStatus: string; criadoEm: Date; primeiraRespostaEm: Date | null; resolvidoEm: Date | null;
  prioridadeId: number; categoriaId: number | null; responsavelId: string | null; liderAtendimentoId: string | null;
  prioridadeConfiguracao: { nome: string; cor: string | null };
  categoria: { nome: string } | null;
  responsavel: { nome: string | null; login: string | null; email: string | null } | null;
  liderAtendimento: { nome: string | null; login: string | null; email: string | null } | null;
};

@Injectable()
export class ChamadoDashboardService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ChamadoAuthorizationService) {}

  async obter(user: JwtPayload): Promise<ChamadoDashboardType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.dashboard, 'visualizar');
    const rows = await this.prisma.chamado.findMany({
      where: { empresaId },
      select: {
        status: true, slaStatus: true, criadoEm: true, primeiraRespostaEm: true, resolvidoEm: true,
        prioridadeId: true, categoriaId: true, responsavelId: true, liderAtendimentoId: true,
        prioridadeConfiguracao: { select: { nome: true, cor: true } },
        categoria: { select: { nome: true } },
        responsavel: { select: { nome: true, login: true, email: true } },
        liderAtendimento: { select: { nome: true, login: true, email: true } }
      }
    }) as DashboardRow[];
    const average = (values: number[]) => values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
    const firstResponse = rows.filter((row) => row.primeiraRespostaEm).map((row) => this.minutes(row.criadoEm, row.primeiraRespostaEm!));
    const resolution = rows.filter((row) => row.resolvidoEm).map((row) => this.minutes(row.criadoEm, row.resolvidoEm!));
    return {
      totalAbertos: rows.filter((row) => (OPEN_STATUSES as readonly string[]).includes(row.status)).length,
      emAtendimento: rows.filter((row) => row.status === 'EM_ATENDIMENTO').length,
      pendentes: rows.filter((row) => row.status === 'PENDENTE').length,
      resolvidos: rows.filter((row) => row.status === 'RESOLVIDO').length,
      arquivados: rows.filter((row) => row.status === 'ARQUIVADO').length,
      atrasados: rows.filter((row) => row.slaStatus === 'ATRASADO').length,
      tempoMedioPrimeiraRespostaMinutos: average(firstResponse), tempoMedioResolucaoMinutos: average(resolution),
      porPrioridade: this.series(rows, (row) => ({ chave: String(row.prioridadeId), nome: row.prioridadeConfiguracao.nome, cor: row.prioridadeConfiguracao.cor })),
      porCategoria: this.series(rows, (row) => ({ chave: row.categoriaId ? String(row.categoriaId) : 'sem-categoria', nome: row.categoria?.nome || 'Sem categoria', cor: null })),
      porAtendente: this.series(rows, (row) => { const attendant = row.responsavel || row.liderAtendimento; const id = row.responsavelId || row.liderAtendimentoId; return { chave: id || 'sem-atendente', nome: attendant?.nome || attendant?.login || attendant?.email || 'Sem atendente', cor: null }; })
    };
  }

  private minutes(start: Date, end: Date): number { return Math.max(0, (end.getTime() - start.getTime()) / 60000); }
  private series(rows: DashboardRow[], selector: (row: DashboardRow) => { chave: string; nome: string; cor: string | null }): ChamadoDashboardSerieType[] {
    const totals = new Map<string, ChamadoDashboardSerieType>();
    rows.forEach((row) => { const item = selector(row); const current = totals.get(item.chave); totals.set(item.chave, current ? { ...current, total: current.total + 1 } : { ...item, total: 1 }); });
    return [...totals.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  }
}