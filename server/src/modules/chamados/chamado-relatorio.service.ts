import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { FEATURES, STATUS } from './constants/chamado.constants';
import { ChamadoRelatorioFiltroInput } from './dto/chamado-relatorio.input';
import { ChamadoRelatorioItemType, ChamadoRelatorioPageType } from './dto/chamado-relatorio.type';

type ReportRow = any;
@Injectable()
export class ChamadoRelatorioService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ChamadoAuthorizationService) {}

  async listar(filtro: ChamadoRelatorioFiltroInput | null | undefined, user: JwtPayload): Promise<ChamadoRelatorioPageType> {
    const { where } = await this.context(filtro, user);
    const page = filtro?.page || 1, pageSize = filtro?.pageSize || 50;
    const [rows, total] = await Promise.all([this.prisma.chamado.findMany({ where, ...this.queryArgs(), skip: (page - 1) * pageSize, take: pageSize }), this.prisma.chamado.count({ where })]);
    return { items: (rows as ReportRow[]).map((row) => this.map(row)), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async exportar(filtro: ChamadoRelatorioFiltroInput | null | undefined, formato: 'csv' | 'xlsx', user: JwtPayload): Promise<{ buffer: Buffer; mimeType: string; nome: string }> {
    const { where } = await this.context(filtro, user);
    const rows = await this.prisma.chamado.findMany({ where, ...this.queryArgs(), take: 10000 }) as ReportRow[];
    const items = rows.map((row) => this.map(row));
    const stamp = new Date().toISOString().slice(0, 10);
    if (formato === 'csv') return { buffer: this.csv(items), mimeType: 'text/csv; charset=utf-8', nome: `relatorio-chamados-${stamp}.csv` };
    return { buffer: await this.xlsx(items), mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', nome: `relatorio-chamados-${stamp}.xlsx` };
  }

  private async context(filtro: ChamadoRelatorioFiltroInput | null | undefined, user: JwtPayload) {
    const empresaId = this.authorization.assertCompanyContext(user); await this.authorization.assertFeatureAction(user, FEATURES.relatorios, 'visualizar');
    const where: any = { empresaId };
    if (filtro?.criadoDe || filtro?.criadoAte) where.criadoEm = { ...(filtro.criadoDe ? { gte: new Date(filtro.criadoDe) } : {}), ...(filtro.criadoAte ? { lte: this.endOfDay(filtro.criadoAte) } : {}) };
    if (filtro?.responsavelId) where.OR = [{ responsavelId: filtro.responsavelId }, { liderAtendimentoId: filtro.responsavelId }];
    if (filtro?.categoriaId) where.categoriaId = filtro.categoriaId; if (filtro?.prioridadeId) where.prioridadeId = filtro.prioridadeId; if (filtro?.slaStatus) where.slaStatus = filtro.slaStatus;
    if (filtro?.status) { const status = filtro.status.toUpperCase(); if (!(STATUS as readonly string[]).includes(status)) throw new BadRequestException('Status de relatorio invalido.'); where.status = status; }
    return { where };
  }
  private queryArgs() { return { include: { prioridadeConfiguracao: true, categoria: true, solicitante: true, responsavel: true, liderAtendimento: true }, orderBy: [{ criadoEm: 'desc' as const }, { numero: 'desc' as const }] }; }
  private map(row: ReportRow): ChamadoRelatorioItemType { const label = (u: any) => u?.nome || u?.login || u?.email || 'Nao informado'; return { id: row.id, numero: row.numero, titulo: row.titulo, status: row.status, slaStatus: row.slaStatus, prioridade: row.prioridadeConfiguracao?.nome || '-', categoria: row.categoria?.nome || 'Sem categoria', solicitante: label(row.solicitante), atendente: row.responsavel || row.liderAtendimento ? label(row.responsavel || row.liderAtendimento) : 'Sem atendente', criadoEm: row.criadoEm, primeiraRespostaEm: row.primeiraRespostaEm, resolvidoEm: row.resolvidoEm, tempoPrimeiraRespostaMinutos: row.primeiraRespostaEm ? this.minutes(row.criadoEm, row.primeiraRespostaEm) : null, tempoResolucaoMinutos: row.resolvidoEm ? this.minutes(row.criadoEm, row.resolvidoEm) : null }; }
  private csv(items: ChamadoRelatorioItemType[]): Buffer { const headers = ['Numero','Titulo','Status','SLA','Prioridade','Categoria','Solicitante','Atendente','Criado em','Primeira resposta','Resolvido em','Tempo primeira resposta (min)','Tempo resolucao (min)']; const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`; const lines = [headers.map(esc).join(';'), ...items.map((i) => [i.numero,i.titulo,i.status,i.slaStatus,i.prioridade,i.categoria,i.solicitante,i.atendente,i.criadoEm.toISOString(),i.primeiraRespostaEm?.toISOString() || '',i.resolvidoEm?.toISOString() || '',i.tempoPrimeiraRespostaMinutos ?? '',i.tempoResolucaoMinutos ?? ''].map(esc).join(';'))]; return Buffer.from('\ufeff' + lines.join('\r\n'), 'utf8'); }
  private async xlsx(items: ChamadoRelatorioItemType[]): Promise<Buffer> { const workbook = new Workbook(); const sheet = workbook.addWorksheet('Chamados', { views: [{ state: 'frozen', ySplit: 1 }] }); sheet.columns = [{header:'Numero',key:'numero',width:12},{header:'Titulo',key:'titulo',width:40},{header:'Status',key:'status',width:18},{header:'SLA',key:'slaStatus',width:22},{header:'Prioridade',key:'prioridade',width:18},{header:'Categoria',key:'categoria',width:24},{header:'Solicitante',key:'solicitante',width:28},{header:'Atendente',key:'atendente',width:28},{header:'Criado em',key:'criadoEm',width:20},{header:'Primeira resposta',key:'primeiraRespostaEm',width:20},{header:'Resolvido em',key:'resolvidoEm',width:20},{header:'Primeira resposta (min)',key:'tempoPrimeiraRespostaMinutos',width:23},{header:'Resolucao (min)',key:'tempoResolucaoMinutos',width:18}]; items.forEach((item) => sheet.addRow(item)); sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3448C5' } }; ['I','J','K'].forEach((column) => { sheet.getColumn(column).numFmt = 'dd/mm/yyyy hh:mm'; }); sheet.autoFilter = { from: 'A1', to: 'M1' }; const data = await workbook.xlsx.writeBuffer(); return Buffer.from(data); }
  private minutes(a: Date, b: Date) { return Math.round(Math.max(0, b.getTime() - a.getTime()) / 6000) / 10; }
  private endOfDay(value: string) { const date = new Date(value); date.setHours(23,59,59,999); return date; }
}