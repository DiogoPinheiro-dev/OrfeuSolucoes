import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoTarefaRecursoType {
  @Field() id!: string;
  @Field() ativo!: boolean;
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
}

@ObjectType()
export class ProjetoTarefaRecursoVinculoType {
  @Field() id!: string;
  @Field() recursoId!: string;
  @Field() ativo!: boolean;
  @Field(() => ProjetoTarefaRecursoType) recurso!: ProjetoTarefaRecursoType;
}

@ObjectType()
export class ProjetoTarefaTaxaHistoricoType {
  @Field() id!: string;
  @Field() valorHora!: string;
  @Field() moeda!: string;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => ProjetoUsuarioType) criadoPor!: ProjetoUsuarioType;
}

@ObjectType()
export class ProjetoTarefaType {
  @Field() id!: string;
  @Field(() => [String]) recursoIds!: string[];
  @Field(() => [ProjetoTarefaRecursoVinculoType]) recursos!: ProjetoTarefaRecursoVinculoType[];
  @Field() funcionalidade!: string;
  @Field(() => Int) estimativaMinutos!: number;
  @Field() valorHora!: string;
  @Field() moeda!: string;
  @Field(() => String, { nullable: true }) observacao?: string | null;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field() pendenteRecurso!: boolean;
  @Field(() => Int) planejadoMinutos!: number;
  @Field(() => Int) saldoMinutos!: number;
  @Field() sobreplanejada!: boolean;
  @Field(() => [ProjetoTarefaTaxaHistoricoType]) taxas!: ProjetoTarefaTaxaHistoricoType[];
}