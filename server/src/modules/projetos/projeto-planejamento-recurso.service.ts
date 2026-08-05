import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import {
  ExcluirPlanejamentoRecursoExecucaoInput,
  SalvarPlanejamentoRecursoExecucaoInput
} from './dto/projeto-planejamento-recurso.input';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoRecursoAuthorizationService, ProjetoRecursoContexto } from './projeto-recurso-authorization.service';
import { ProjetoRecursoService } from './projeto-recurso.service';
import { ProjetoTarefaService } from './projeto-tarefa.service';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const PROJECT_SELECT = { id: true, chave: true, nome: true, arquivadoEm: true };
const PLANNING_INCLUDE = {
  cadastro: { include: { usuario: { select: USER_SELECT } } },
  projeto: { select: PROJECT_SELECT },
  alocacoes: { orderBy: { inicioEm: 'desc' as const } }
};

@Injectable()
export class ProjetoPlanejamentoRecursoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoRecursoAuthorizationService,
    private readonly recursos: ProjetoRecursoService,
    private readonly tarefas: ProjetoTarefaService,
    private readonly auditoria: ProjetoAuditoriaService,
    private readonly periodo: ProjetoPeriodoService
  ) {}

  async painel(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    const [recursos, projetos, tarefas, vinculos] = await Promise.all([
      this.recursos.painel(user),
      this.recursos.projetos(user),
      this.tarefas.painel(user),
      this.prisma.projetoRecurso.findMany({ where: { empresaId }, include: PLANNING_INCLUDE, orderBy: { criadoEm: 'asc' } })
    ]);

    const tarefasPorRecurso = new Map<string, any[]>();
    for (const tarefa of tarefas.tarefas) {
      for (const recurso of tarefa.recursos) {
        const atuais = tarefasPorRecurso.get(recurso.recursoId) ?? [];
        atuais.push(tarefa);
        tarefasPorRecurso.set(recurso.recursoId, atuais);
      }
    }

    return {
      recursos: recursos.recursos,
      projetos,
      permissoes: recursos.permissoes,
      tarefas: tarefas.tarefas,
      tarefasPendentes: tarefas.tarefas.filter((item) => item.pendenteRecurso),
      linhas: vinculos.map((vinculo) => this.linha(vinculo, tarefasPorRecurso.get(vinculo.recursoId) ?? []))
    };
  }


  async salvarExecucao(input: SalvarPlanejamentoRecursoExecucaoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    const vinculo = await this.assertVinculoAtivo(contexto, input.projetoRecursoId);
    const inicio = this.date(input.inicioEm);
    const fim = this.date(input.fimEm);
    this.periodo.assertPeriodoValido(inicio, fim);
    const tarefa = await this.resolveTarefa(contexto, vinculo.recursoId, input.tarefaId);
    const atividade = tarefa.funcionalidade;
    const record = await this.prisma.$transaction(async (tx) => {
      const saved = input.id
        ? await this.updateVersioned(tx.projetoAlocacao, input.id, input.versao, { tarefaId: tarefa.id, atividade, inicioEm: inicio, fimEm: fim, alocacaoMinutos: input.alocacaoMinutos }, 'A execucao', { projetoId: input.projetoId, recursoId: input.projetoRecursoId })
        : await tx.projetoAlocacao.create({ data: { empresaId: contexto.empresaId, projetoId: input.projetoId, recursoId: input.projetoRecursoId, tarefaId: tarefa.id, atividade, inicioEm: inicio, fimEm: fim, alocacaoMinutos: input.alocacaoMinutos } });
      await this.audit(tx, contexto.empresaId, input.projetoId, user, 'ALOCACAO', saved.id, input.id ? 'ALTERADA' : 'CRIADA', { projetoRecursoId: input.projetoRecursoId, tarefaId: tarefa.id, atividade, alocacaoMinutos: input.alocacaoMinutos });
      return saved;
    });
    return this.findExecucao(input.projetoRecursoId, record.id, user);
  }

  async excluirExecucao(input: ExcluirPlanejamentoRecursoExecucaoInput, user: JwtPayload) {
    const contexto = await this.authorization.contexto(input.projetoId, user, ProjetoAcao.EXCLUIR);
    if (contexto.projeto.arquivadoEm) throw new BadRequestException('O projeto arquivado esta disponivel somente para consulta.');
    return this.prisma.$transaction(async (tx) => {
      const atual = await tx.projetoAlocacao.findFirst({ where: { id: input.id, projetoId: input.projetoId } });
      await this.deleteVersioned(tx.projetoAlocacao, input.id, input.versao, 'A execucao', { projetoId: input.projetoId });
      await this.audit(tx, contexto.empresaId, input.projetoId, user, 'ALOCACAO', input.id, 'EXCLUIDA', { projetoRecursoId: atual?.recursoId, tarefaId: atual?.tarefaId, atividade: atual?.atividade, inicioEm: atual?.inicioEm, fimEm: atual?.fimEm });
      return true;
    });
  }

  private async resolveTarefa(contexto: ProjetoRecursoContexto, recursoId: string, tarefaId: string) {
    const tarefa = await this.prisma.projetoTarefa.findFirst({ where: { id: tarefaId, empresaId: contexto.empresaId, recursos: { some: { recursoId } } } });
    if (!tarefa) throw new BadRequestException('Selecione uma tarefa vinculada a este recurso.');
    if (!tarefa.ativo) throw new BadRequestException('Tarefas inativas nao podem receber novas execucoes.');
    return tarefa;
  }

  private async assertVinculoAtivo(contexto: ProjetoRecursoContexto, projetoRecursoId: string) {
    if (contexto.projeto.arquivadoEm) throw new BadRequestException('O projeto arquivado esta disponivel somente para consulta.');
    const vinculo = await this.prisma.projetoRecurso.findFirst({ where: { id: projetoRecursoId, projetoId: contexto.projeto.id, empresaId: contexto.empresaId, ativo: true }, include: { cadastro: true } });
    if (!vinculo || !vinculo.cadastro.ativo) throw new BadRequestException('Selecione um recurso ativo vinculado a este projeto.');
    return vinculo;
  }

  private async findExecucao(projetoRecursoId: string, id: string, user: JwtPayload) {
    const linha = (await this.painel(user)).linhas.find((item) => item.id === projetoRecursoId);
    const execucao = linha?.alocacoes.find((item: { id: string }) => item.id === id);
    if (!execucao) throw new NotFoundException('Execucao planejada nao encontrada.');
    return execucao;
  }

  private linha(item: any, tarefas: any[]) {
    const alocacoes = (item.alocacoes ?? []).map((entry: any) => ({ ...entry, projetoRecursoId: entry.recursoId }));
    const tarefasPlanejadas = tarefas.map((tarefa) => {
      const planejadoMinutos = alocacoes
        .filter((alocacao: any) => alocacao.tarefaId === tarefa.id)
        .reduce((total: number, alocacao: any) => total + Number(alocacao.alocacaoMinutos || 0), 0);
      return { ...tarefa, planejadoMinutos, saldoMinutos: Number(tarefa.estimativaMinutos || 0) - planejadoMinutos, sobreplanejada: planejadoMinutos > Number(tarefa.estimativaMinutos || 0) };
    });
    const estimativaTotalMinutos = tarefasPlanejadas.reduce((total, tarefa) => total + Number(tarefa.estimativaMinutos || 0), 0);
    const planejamentoTarefasMinutos = tarefasPlanejadas.reduce((total, tarefa) => total + Number(tarefa.planejadoMinutos || 0), 0);
    const alocacaoTotalMinutos = alocacoes.reduce((total: number, alocacao: any) => total + Number(alocacao.alocacaoMinutos || 0), 0);
    const alocacoesPendentes = alocacoes.filter((alocacao: any) => !alocacao.tarefaId).length;
    const custos = new Map<string, Prisma.Decimal>();

    for (const tarefa of tarefasPlanejadas) {
      const moeda = tarefa.moeda || 'BRL';
      const custo = new Prisma.Decimal(tarefa.valorHora || 0).mul(new Prisma.Decimal(tarefa.estimativaMinutos || 0)).div(60);
      custos.set(moeda, (custos.get(moeda) ?? new Prisma.Decimal(0)).add(custo));
    }

    return {
      id: item.id,
      cadastroRecursoId: item.recursoId,
      projetoId: item.projetoId,
      versao: item.versao,
      recursoAtivo: item.cadastro.ativo,
      vinculoAtivo: item.ativo,
      usuario: this.user(item.cadastro.usuario),
      projeto: item.projeto,
      alocacaoTotalMinutos,
      tarefas: tarefasPlanejadas,
      estimativaTotalMinutos,
      planejamentoTarefasMinutos,
      saldoTarefasMinutos: estimativaTotalMinutos - planejamentoTarefasMinutos,
      alocacoesPendentes,
      possuiRisco: tarefasPlanejadas.some((tarefa) => tarefa.sobreplanejada) || alocacoesPendentes > 0,
      custosEstimados: Array.from(custos.entries()).map(([moeda, valor]) => ({ moeda, valor: valor.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2) })),
      alocacoes
    };
  }

  private date(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Data invalida.');
    return date;
  }

  private user(item: any) { return { id: item.id, nome: item.nome ?? null, login: item.login ?? null, email: item.email }; }
  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, label: string, scope: Record<string, unknown>) { if (!versao) throw new BadRequestException('Informe a versao para alterar o registro.'); const result = await model.updateMany({ where: { id, versao, ...scope }, data: { ...data, versao: { increment: 1 } } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa. Atualize os dados.`); const record = await model.findUnique({ where: { id } }); if (!record) throw new NotFoundException(`${label} nao foi encontrado.`); return record; }
  private async deleteVersioned(model: any, id: string, versao: number, label: string, scope: Record<string, unknown>) { const result = await model.deleteMany({ where: { id, versao, ...scope } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa ou nao existe mais. Atualize os dados.`); }
  private audit(tx: Prisma.TransactionClient, empresaId: number, projetoId: string, user: JwtPayload, entidade: string, entidadeId: string, evento: string, dados: any) { return this.auditoria.registrar(tx, { empresaId, projetoId, usuarioId: user.sub, entidade, entidadeId, evento, dados }); }
}
