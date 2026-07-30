import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GradeAlocacaoType, GradeCapacidadeType, GradeCapacitacaoPermissoesType } from './projeto-grade-capacitacao.type';
import { ProjetoRecursoProjetoType, ProjetoRecursoType } from './projeto-recurso.type';
import { ProjetoTarefaType } from './projeto-tarefa.type';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class PlanejamentoRecursoCustoType {
  @Field() moeda!: string;
  @Field() valor!: string;
}

@ObjectType()
export class PlanejamentoRecursoLinhaType {
  @Field() id!: string;
  @Field() cadastroRecursoId!: string;
  @Field() projetoId!: string;
  @Field(() => Int) versao!: number;
  @Field() recursoAtivo!: boolean;
  @Field() vinculoAtivo!: boolean;
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
  @Field(() => ProjetoRecursoProjetoType) projeto!: ProjetoRecursoProjetoType;
  @Field(() => Int) capacidadeTotalMinutos!: number;
  @Field(() => Int) alocacaoTotalMinutos!: number;
  @Field(() => Int) saldoMinutos!: number;
  @Field(() => Int) percentualAlocado!: number;
  @Field() sobrealocado!: boolean;
  @Field(() => Int) estimativaTotalMinutos!: number;
  @Field(() => Int) planejamentoTarefasMinutos!: number;
  @Field(() => Int) saldoTarefasMinutos!: number;
  @Field(() => Int) alocacoesPendentes!: number;
  @Field() possuiRisco!: boolean;
  @Field(() => [PlanejamentoRecursoCustoType]) custosEstimados!: PlanejamentoRecursoCustoType[];
  @Field(() => [ProjetoTarefaType]) tarefas!: ProjetoTarefaType[];
  @Field(() => [GradeCapacidadeType]) capacidades!: GradeCapacidadeType[];
  @Field(() => [GradeAlocacaoType]) alocacoes!: GradeAlocacaoType[];
}

@ObjectType()
export class PlanejamentoRecursoPainelType {
  @Field(() => [ProjetoRecursoType]) recursos!: ProjetoRecursoType[];
  @Field(() => [ProjetoRecursoProjetoType]) projetos!: ProjetoRecursoProjetoType[];
  @Field(() => [PlanejamentoRecursoLinhaType]) linhas!: PlanejamentoRecursoLinhaType[];
  @Field(() => [ProjetoTarefaType]) tarefasPendentes!: ProjetoTarefaType[];
  @Field(() => GradeCapacitacaoPermissoesType) permissoes!: GradeCapacitacaoPermissoesType;
}
