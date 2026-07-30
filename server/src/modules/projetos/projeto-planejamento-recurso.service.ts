import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoGradeCapacitacaoService } from './projeto-grade-capacitacao.service';
import { ProjetoTarefaService } from './projeto-tarefa.service';

@Injectable()
export class ProjetoPlanejamentoRecursoService {
  constructor(
    private readonly grade: ProjetoGradeCapacitacaoService,
    private readonly tarefas: ProjetoTarefaService
  ) {}

  async painel(user: JwtPayload) {
    const [grade, tarefas] = await Promise.all([
      this.grade.painel(user),
      this.tarefas.painel(user)
    ]);

    const tarefasPorVinculo = new Map<string, any[]>();
    for (const tarefa of tarefas.tarefas) {
      if (!tarefa.projetoRecursoId) continue;
      const atuais = tarefasPorVinculo.get(tarefa.projetoRecursoId) ?? [];
      atuais.push(tarefa);
      tarefasPorVinculo.set(tarefa.projetoRecursoId, atuais);
    }

    return {
      recursos: grade.recursos,
      projetos: grade.projetos,
      permissoes: grade.permissoes,
      tarefasPendentes: tarefas.tarefas.filter((item) => !item.projetoRecursoId),
      linhas: grade.linhas.map((linha) => this.linha(linha, tarefasPorVinculo.get(linha.id) ?? []))
    };
  }

  private linha(linha: any, tarefas: any[]) {
    const tarefasPlanejadas = tarefas.map((tarefa) => {
      const planejadoMinutos = linha.alocacoes
        .filter((alocacao: any) => alocacao.tarefaId === tarefa.id)
        .reduce((total: number, alocacao: any) => total + Number(alocacao.alocacaoMinutos || 0), 0);
      return { ...tarefa, planejadoMinutos, saldoMinutos: Number(tarefa.estimativaMinutos || 0) - planejadoMinutos, sobreplanejada: planejadoMinutos > Number(tarefa.estimativaMinutos || 0) };
    });
    const estimativaTotalMinutos = tarefasPlanejadas.reduce((total, tarefa) => total + Number(tarefa.estimativaMinutos || 0), 0);
    const planejamentoTarefasMinutos = tarefasPlanejadas.reduce((total, tarefa) => total + Number(tarefa.planejadoMinutos || 0), 0);
    const custos = new Map<string, Prisma.Decimal>();

    for (const tarefa of tarefasPlanejadas) {
      const moeda = tarefa.moeda || 'BRL';
      const custo = new Prisma.Decimal(tarefa.valorHora || 0)
        .mul(new Prisma.Decimal(tarefa.estimativaMinutos || 0))
        .div(60);
      custos.set(moeda, (custos.get(moeda) ?? new Prisma.Decimal(0)).add(custo));
    }

    const alocacoesPendentes = linha.alocacoes.filter((item: any) => !item.tarefaId).length;
    return {
      ...linha,
      tarefas: tarefasPlanejadas,
      estimativaTotalMinutos,
      planejamentoTarefasMinutos,
      saldoTarefasMinutos: estimativaTotalMinutos - planejamentoTarefasMinutos,
      alocacoesPendentes,
      possuiRisco: linha.sobrealocado || tarefasPlanejadas.some((item) => item.sobreplanejada) || alocacoesPendentes > 0,
      custosEstimados: Array.from(custos.entries()).map(([moeda, valor]) => ({
        moeda,
        valor: valor.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2)
      }))
    };
  }
}
