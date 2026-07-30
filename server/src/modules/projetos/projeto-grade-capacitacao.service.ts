import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { ExcluirGradeItemInput, SalvarGradeAlocacaoInput, SalvarGradeCapacidadeInput, SalvarGradeVinculoInput } from './dto/projeto-grade-capacitacao.input';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoGradeCapacitacaoAuthorizationService, ProjetoGradeCapacitacaoContexto } from './projeto-grade-capacitacao-authorization.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const PROJECT_SELECT = { id: true, chave: true, nome: true, arquivadoEm: true };
const GRADE_INCLUDE = {
  cadastro: { include: { usuario: { select: USER_SELECT } } },
  projeto: { select: PROJECT_SELECT },
  capacidades: { orderBy: { inicioEm: 'desc' as const } },
  alocacoes: { orderBy: { inicioEm: 'desc' as const } }
};

@Injectable()
export class ProjetoGradeCapacitacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoGradeCapacitacaoAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService,
    private readonly periodo: ProjetoPeriodoService
  ) {}

  async painel(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    const [vinculos, recursos, projetos, permissoes] = await Promise.all([
      this.prisma.projetoRecurso.findMany({ where: { empresaId }, include: GRADE_INCLUDE, orderBy: { criadoEm: 'asc' } }),
      this.prisma.recurso.findMany({ where: { empresaId }, include: { usuario: { select: USER_SELECT } }, orderBy: { criadoEm: 'asc' } }),
      this.prisma.projeto.findMany({ where: { empresaId }, select: PROJECT_SELECT, orderBy: [{ arquivadoEm: 'asc' }, { nome: 'asc' }] }),
      this.authorization.permissoes(user)
    ]);
    const capacidadesEmpresa = vinculos.flatMap((vinculo) => vinculo.capacidades.map((item) => ({ ...item, cadastroRecursoId: vinculo.recursoId })));
    const alocacoesEmpresa = vinculos.flatMap((vinculo) => vinculo.alocacoes.map((item) => ({ ...item, cadastroRecursoId: vinculo.recursoId })));
    return { recursos: recursos.map((item) => this.recurso(item)), projetos, linhas: vinculos.map((item) => this.linha(item, capacidadesEmpresa, alocacoesEmpresa)), permissoes };
  }

  async salvarVinculo(input: SalvarGradeVinculoInput, user: JwtPayload) {
    const action = input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR;
    const contexto = await this.authorization.contexto(input.projetoId, user, action);
    const recurso = await this.prisma.recurso.findFirst({ where: { id: input.cadastroRecursoId, empresaId: contexto.empresaId } });
    if (!recurso) throw new NotFoundException('Recurso nao encontrado.');
    const atual = input.id ? await this.prisma.projetoRecurso.findFirst({ where: { id: input.id, empresaId: contexto.empresaId } }) : null;
    if (input.id && !atual) throw new NotFoundException('Alocacao do recurso nao encontrada.');
    if (atual && (atual.recursoId !== input.cadastroRecursoId || atual.projetoId !== input.projetoId)) {
      throw new BadRequestException('Recurso e projeto nao podem ser alterados. Cadastre outra alocacao.');
    }
    if (input.ativo && !recurso.ativo) throw new BadRequestException('Somente recursos ativos podem ser alocados.');
    if (input.ativo && contexto.projeto.arquivadoEm) throw new BadRequestException('Projetos arquivados nao podem receber alocacoes de recursos.');
    if (!atual) {
      const existente = await this.prisma.projetoRecurso.findUnique({ where: { projetoId_recursoId: { projetoId: input.projetoId, recursoId: input.cadastroRecursoId } } });
      if (existente) throw new BadRequestException('Este recurso ja possui alocacao no projeto. Altere o vinculo existente.');
      if (!input.ativo) throw new BadRequestException('Uma nova alocacao deve ser criada como ativa.');
    }

    const saved = await this.prisma.$transaction(async (tx) => {
      const vinculo = atual
        ? await this.updateVersioned(tx.projetoRecurso, atual.id, input.versao, { ativo: input.ativo }, 'A alocacao do recurso', { empresaId: contexto.empresaId })
        : await tx.projetoRecurso.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId, recursoId: input.cadastroRecursoId, ativo: true } });
      if (vinculo.ativo) await this.incluirParticipacao(tx, vinculo.projetoId, recurso.usuarioId);
      else await this.removerParticipacaoAutomatica(tx, vinculo.projetoId, recurso.usuarioId);
      await this.audit(tx, contexto.empresaId, vinculo.projetoId, user, 'RECURSO', recurso.id, vinculo.ativo ? 'ALOCADO' : 'DESALOCADO', { projetoRecursoId: vinculo.id, usuarioId: recurso.usuarioId });
      return vinculo;
    });
    return this.findLinha(saved.id, user);
  }

  async salvarCapacidade(input: SalvarGradeCapacidadeInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    await this.assertVinculoAtivo(contexto, input.projetoRecursoId);
    const inicio = this.date(input.inicioEm); const fim = this.date(input.fimEm); this.periodo.assertPeriodoValido(inicio, fim);
    const overlap = await this.prisma.projetoCapacidade.findFirst({ where: { projetoId: input.projetoId, recursoId: input.projetoRecursoId, ...(input.id ? { id: { not: input.id } } : {}), inicioEm: { lte: fim }, fimEm: { gte: inicio } } });
    if (overlap) throw new BadRequestException('Ja existe capacidade cadastrada para um periodo sobreposto.');
    const record = await this.prisma.$transaction(async (tx) => {
      const saved = input.id
        ? await this.updateVersioned(tx.projetoCapacidade, input.id, input.versao, { inicioEm: inicio, fimEm: fim, capacidadeMinutos: input.capacidadeMinutos }, 'A capacidade', { projetoId: input.projetoId, recursoId: input.projetoRecursoId })
        : await tx.projetoCapacidade.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId, recursoId: input.projetoRecursoId, inicioEm: inicio, fimEm: fim, capacidadeMinutos: input.capacidadeMinutos } });
      await this.audit(tx, contexto.empresaId, input.projetoId, user, 'CAPACIDADE', saved.id, input.id ? 'ALTERADA' : 'CRIADA', { projetoRecursoId: input.projetoRecursoId, capacidadeMinutos: input.capacidadeMinutos });
      return saved;
    });
    return this.findPeriodo(input.projetoRecursoId, record.id, user, 'capacidades');
  }

  async salvarAlocacao(input: SalvarGradeAlocacaoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    await this.assertVinculoAtivo(contexto, input.projetoRecursoId);
    const inicio = this.date(input.inicioEm); const fim = this.date(input.fimEm); this.periodo.assertPeriodoValido(inicio, fim);
    const tarefa = await this.resolveTarefa(contexto, input.projetoRecursoId, input.tarefaId, input.atividade, input.id);
    const atividade = tarefa.funcionalidade;
    const record = await this.prisma.$transaction(async (tx) => {
      const saved = input.id
        ? await this.updateVersioned(tx.projetoAlocacao, input.id, input.versao, { tarefaId: tarefa.id, atividade, inicioEm: inicio, fimEm: fim, alocacaoMinutos: input.alocacaoMinutos }, 'A alocacao', { projetoId: input.projetoId, recursoId: input.projetoRecursoId })
        : await tx.projetoAlocacao.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId, recursoId: input.projetoRecursoId, tarefaId: tarefa.id, atividade, inicioEm: inicio, fimEm: fim, alocacaoMinutos: input.alocacaoMinutos } });
      await this.audit(tx, contexto.empresaId, input.projetoId, user, 'ALOCACAO', saved.id, input.id ? 'ALTERADA' : 'CRIADA', { projetoRecursoId: input.projetoRecursoId, tarefaId: tarefa.id, atividade, alocacaoMinutos: input.alocacaoMinutos });
      return saved;
    });
    return this.findPeriodo(input.projetoRecursoId, record.id, user, 'alocacoes');
  }

  excluirCapacidade(input: ExcluirGradeItemInput, user: JwtPayload) { return this.excluirPeriodo(input, user, 'projetoCapacidade', 'CAPACIDADE', 'A capacidade'); }
  excluirAlocacao(input: ExcluirGradeItemInput, user: JwtPayload) { return this.excluirPeriodo(input, user, 'projetoAlocacao', 'ALOCACAO', 'A alocacao'); }

  private async excluirPeriodo(input: ExcluirGradeItemInput, user: JwtPayload, model: 'projetoCapacidade' | 'projetoAlocacao', entidade: string, label: string) {
    const contexto = await this.authorization.contexto(input.projetoId, user, ProjetoAcao.EXCLUIR);
    if (contexto.projeto.arquivadoEm) throw new BadRequestException('O projeto arquivado esta disponivel somente para consulta.');
    return this.prisma.$transaction(async (tx) => {
      await this.deleteVersioned(tx[model], input.id, input.versao, label, { projetoId: input.projetoId });
      await this.audit(tx, contexto.empresaId, input.projetoId, user, entidade, input.id, 'EXCLUIDA', {});
      return true;
    });
  }

  private async resolveTarefa(contexto: ProjetoGradeCapacitacaoContexto, projetoRecursoId: string, tarefaId?: string | null, atividade?: string | null, alocacaoId?: string | null) {
    let selecionadaId = tarefaId || null;
    if (!selecionadaId && alocacaoId) {
      const atual = await this.prisma.projetoAlocacao.findFirst({ where: { id: alocacaoId, empresaId: contexto.empresaId, recursoId: projetoRecursoId }, select: { tarefaId: true } });
      selecionadaId = atual?.tarefaId ?? null;
    }
    if (selecionadaId) {
      const tarefa = await this.prisma.projetoTarefa.findFirst({ where: { id: selecionadaId, empresaId: contexto.empresaId, projetoRecursoId } });
      if (!tarefa) throw new BadRequestException('Selecione uma tarefa vinculada a este recurso e projeto.');
      if (!tarefa.ativo) throw new BadRequestException('Tarefas inativas nao podem receber novas execucoes.');
      return tarefa;
    }
    const descricao = atividade?.trim().toLocaleLowerCase('pt-BR') || '';
    const candidatas = descricao
      ? (await this.prisma.projetoTarefa.findMany({ where: { empresaId: contexto.empresaId, projetoRecursoId, ativo: true } }))
        .filter((item) => item.funcionalidade.trim().toLocaleLowerCase('pt-BR') === descricao)
      : [];
    if (candidatas.length === 1) return candidatas[0]!;
    throw new BadRequestException(candidatas.length > 1
      ? 'Existe mais de uma tarefa com esta descricao. Selecione a tarefa correta.'
      : 'Selecione a tarefa que sera executada neste periodo.');
  }

  private async assertVinculoAtivo(contexto: ProjetoGradeCapacitacaoContexto, projetoRecursoId: string) {
    if (contexto.projeto.arquivadoEm) throw new BadRequestException('O projeto arquivado esta disponivel somente para consulta.');
    const vinculo = await this.prisma.projetoRecurso.findFirst({ where: { id: projetoRecursoId, projetoId: contexto.projeto.id, empresaId: contexto.empresaId, ativo: true }, include: { cadastro: true } });
    if (!vinculo || !vinculo.cadastro.ativo) throw new BadRequestException('Selecione um recurso ativo e alocado neste projeto.');
  }

  private async findPeriodo(projetoRecursoId: string, id: string, user: JwtPayload, field: 'capacidades' | 'alocacoes') {
    const painel = await this.painel(user);
    const linha = painel.linhas.find((item) => item.id === projetoRecursoId);
    const periodo = linha?.[field].find((item: { id: string }) => item.id === id);
    if (!periodo) throw new NotFoundException('Periodo da grade nao encontrado.');
    return periodo;
  }

  private async findLinha(projetoRecursoId: string, user: JwtPayload) {
    const linha = (await this.painel(user)).linhas.find((item) => item.id === projetoRecursoId);
    if (!linha) throw new NotFoundException('Alocacao do recurso nao encontrada.');
    return linha;
  }

  private async incluirParticipacao(tx: Prisma.TransactionClient, projetoId: string, usuarioId: string) {
    const projeto = await tx.projeto.findUnique({ where: { id: projetoId }, select: { responsavelId: true } });
    if (!projeto || projeto.responsavelId === usuarioId) return;
    const existente = await tx.projetoMembro.findUnique({ where: { projetoId_usuarioId: { projetoId, usuarioId } } });
    if (!existente) await tx.projetoMembro.create({ data: { projetoId, usuarioId, papel: 'MEMBRO', origem: 'RECURSO' } });
  }

  private async removerParticipacaoAutomatica(tx: Prisma.TransactionClient, projetoId: string, usuarioId: string) {
    await tx.projetoMembro.deleteMany({ where: { projetoId, usuarioId, origem: 'RECURSO' } });
  }

  private linha(item: any, capacidadesEmpresa: any[], alocacoesEmpresa: any[]) {
    const cadastroRecursoId = item.recursoId;
    const capacidades = (item.capacidades ?? []).map((entry: any) => {
      const alocadoMinutos = this.sumOverlap(alocacoesEmpresa, cadastroRecursoId, entry.inicioEm, entry.fimEm, 'alocacaoMinutos');
      return { ...entry, projetoRecursoId: entry.recursoId, alocadoMinutos, percentualAlocado: this.percent(alocadoMinutos, entry.capacidadeMinutos), sobrealocado: alocadoMinutos > entry.capacidadeMinutos };
    });
    const alocacoes = (item.alocacoes ?? []).map((entry: any) => {
      const capacidadeMinutos = this.sumOverlap(capacidadesEmpresa, cadastroRecursoId, entry.inicioEm, entry.fimEm, 'capacidadeMinutos');
      const alocadoTotalMinutos = this.sumOverlap(alocacoesEmpresa, cadastroRecursoId, entry.inicioEm, entry.fimEm, 'alocacaoMinutos');
      return { ...entry, projetoRecursoId: entry.recursoId, capacidadeMinutos, alocadoTotalMinutos, percentualAlocado: this.percent(alocadoTotalMinutos, capacidadeMinutos), sobrealocado: capacidadeMinutos === 0 || alocadoTotalMinutos > capacidadeMinutos };
    });
    const capacidadeTotalMinutos = capacidades.reduce((sum: number, entry: any) => sum + Number(entry.capacidadeMinutos || 0), 0);
    const alocacaoTotalMinutos = alocacoes.reduce((sum: number, entry: any) => sum + Number(entry.alocacaoMinutos || 0), 0);
    return {
      id: item.id,
      cadastroRecursoId,
      projetoId: item.projetoId,
      versao: item.versao,
      recursoAtivo: item.cadastro.ativo,
      vinculoAtivo: item.ativo,
      usuario: this.user(item.cadastro.usuario),
      projeto: item.projeto,
      capacidadeTotalMinutos,
      alocacaoTotalMinutos,
      saldoMinutos: capacidadeTotalMinutos - alocacaoTotalMinutos,
      percentualAlocado: this.percent(alocacaoTotalMinutos, capacidadeTotalMinutos),
      sobrealocado: capacidades.some((entry: any) => entry.sobrealocado) || alocacoes.some((entry: any) => entry.sobrealocado),
      capacidades,
      alocacoes
    };
  }

  private date(value: string) { const date = new Date(`${value}T00:00:00.000Z`); if (Number.isNaN(date.getTime())) throw new BadRequestException('Data invalida.'); return date; }
  private percent(value: number, capacity: number) { return capacity > 0 ? Math.round((value / capacity) * 100) : value > 0 ? 100 : 0; }
  private overlaps(item: any, cadastroRecursoId: string, start: Date, end: Date) { return item.cadastroRecursoId === cadastroRecursoId && new Date(item.inicioEm) <= end && new Date(item.fimEm) >= start; }
  private sumOverlap(items: any[], cadastroRecursoId: string, start: Date, end: Date, field: string) { return items.filter((item) => this.overlaps(item, cadastroRecursoId, start, end)).reduce((sum, item) => sum + Number(item[field] || 0), 0); }
  private user(item: any) { return { id: item.id, nome: item.nome ?? null, login: item.login ?? null, email: item.email }; }
  private recurso(item: any) { return { id: item.id, usuarioId: item.usuarioId, ativo: item.ativo, versao: item.versao, usuario: this.user(item.usuario) }; }
  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, label: string, scope: Record<string, unknown>) { if (!versao) throw new BadRequestException('Informe a versao para alterar o registro.'); const result = await model.updateMany({ where: { id, versao, ...scope }, data: { ...data, versao: { increment: 1 } } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa. Atualize os dados.`); const record = await model.findUnique({ where: { id } }); if (!record) throw new NotFoundException(`${label} nao foi encontrado.`); return record; }
  private async deleteVersioned(model: any, id: string, versao: number, label: string, scope: Record<string, unknown>) { const result = await model.deleteMany({ where: { id, versao, ...scope } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa ou nao existe mais. Atualize os dados.`); }
  private audit(tx: Prisma.TransactionClient, empresaId: number, projetoId: string, user: JwtPayload, entidade: string, entidadeId: string, evento: string, dados: any) { return this.auditoria.registrar(tx, { empresaId, projetoId, usuarioId: user.sub, entidade, entidadeId, evento, dados }); }
}
