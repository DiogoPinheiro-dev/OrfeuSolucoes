import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';
import { ProjetoRecursoProjetoType, ProjetoRecursoType } from './projeto-recurso.type';

@ObjectType()
export class GradeCapacidadeType {
  @Field() id!: string;
  @Field() projetoRecursoId!: string;
  @Field(() => Date) inicioEm!: Date;
  @Field(() => Date) fimEm!: Date;
  @Field(() => Int) capacidadeMinutos!: number;
  @Field(() => Int) alocadoMinutos!: number;
  @Field(() => Int) percentualAlocado!: number;
  @Field() sobrealocado!: boolean;
  @Field(() => Int) versao!: number;
}

@ObjectType()
export class GradeAlocacaoType {
  @Field() id!: string;
  @Field() projetoRecursoId!: string;
  @Field(() => String, { nullable: true }) tarefaId?: string | null;
  @Field(() => String, { nullable: true }) atividade?: string | null;
  @Field(() => Date) inicioEm!: Date;
  @Field(() => Date) fimEm!: Date;
  @Field(() => Int) alocacaoMinutos!: number;
  @Field(() => Int) capacidadeMinutos!: number;
  @Field(() => Int) alocadoTotalMinutos!: number;
  @Field(() => Int) percentualAlocado!: number;
  @Field() sobrealocado!: boolean;
  @Field(() => Int) versao!: number;
}

@ObjectType()
export class GradeCapacitacaoLinhaType {
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
  @Field(() => [GradeCapacidadeType]) capacidades!: GradeCapacidadeType[];
  @Field(() => [GradeAlocacaoType]) alocacoes!: GradeAlocacaoType[];
}

@ObjectType()
export class GradeCapacitacaoPermissoesType {
  @Field() podeIncluir!: boolean;
  @Field() podeAlterar!: boolean;
  @Field() podeExcluir!: boolean;
}

@ObjectType()
export class GradeCapacitacaoPainelType {
  @Field(() => [ProjetoRecursoType]) recursos!: ProjetoRecursoType[];
  @Field(() => [ProjetoRecursoProjetoType]) projetos!: ProjetoRecursoProjetoType[];
  @Field(() => [GradeCapacitacaoLinhaType]) linhas!: GradeCapacitacaoLinhaType[];
  @Field(() => GradeCapacitacaoPermissoesType) permissoes!: GradeCapacitacaoPermissoesType;
}
