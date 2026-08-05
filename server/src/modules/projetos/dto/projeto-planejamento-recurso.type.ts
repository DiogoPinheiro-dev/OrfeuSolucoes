import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoRecursoPermissoesType, ProjetoRecursoProjetoType, ProjetoRecursoType } from './projeto-recurso.type';
import { ProjetoTarefaType } from './projeto-tarefa.type';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class PlanejamentoRecursoCustoType {
  @Field() moeda!: string;
  @Field() valor!: string;
}

@ObjectType()
export class PlanejamentoRecursoExecucaoType {
  @Field() id!: string;
  @Field() projetoRecursoId!: string;
  @Field(() => String, { nullable: true }) tarefaId?: string | null;
  @Field(() => String, { nullable: true }) atividade?: string | null;
  @Field(() => Date) inicioEm!: Date;
  @Field(() => Date) fimEm!: Date;
  @Field(() => Int) alocacaoMinutos!: number;
  @Field(() => Int) versao!: number;
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
  @Field(() => Int) alocacaoTotalMinutos!: number;
  @Field(() => Int) estimativaTotalMinutos!: number;
  @Field(() => Int) planejamentoTarefasMinutos!: number;
  @Field(() => Int) saldoTarefasMinutos!: number;
  @Field(() => Int) alocacoesPendentes!: number;
  @Field() possuiRisco!: boolean;
  @Field(() => [PlanejamentoRecursoCustoType]) custosEstimados!: PlanejamentoRecursoCustoType[];
  @Field(() => [ProjetoTarefaType]) tarefas!: ProjetoTarefaType[];
  @Field(() => [PlanejamentoRecursoExecucaoType]) alocacoes!: PlanejamentoRecursoExecucaoType[];
}

@ObjectType()
export class PlanejamentoRecursoPainelType {
  @Field(() => [ProjetoRecursoType]) recursos!: ProjetoRecursoType[];
  @Field(() => [ProjetoRecursoProjetoType]) projetos!: ProjetoRecursoProjetoType[];
  @Field(() => [PlanejamentoRecursoLinhaType]) linhas!: PlanejamentoRecursoLinhaType[];
  @Field(() => [ProjetoTarefaType]) tarefas!: ProjetoTarefaType[];
  @Field(() => [ProjetoTarefaType]) tarefasPendentes!: ProjetoTarefaType[];
  @Field(() => ProjetoRecursoPermissoesType) permissoes!: ProjetoRecursoPermissoesType;
}
