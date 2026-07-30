import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoRecursoProjetoType } from './projeto-recurso.type';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoTarefaRecursoType {
  @Field() id!: string;
  @Field() ativo!: boolean;
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
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
  @Field() recursoId!: string;
  @Field(() => String, { nullable: true }) projetoRecursoId?: string | null;
  @Field() funcionalidade!: string;
  @Field(() => Int) estimativaMinutos!: number;
  @Field() valorHora!: string;
  @Field() moeda!: string;
  @Field(() => String, { nullable: true }) observacao?: string | null;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoTarefaRecursoType) recurso!: ProjetoTarefaRecursoType;
  @Field(() => ProjetoRecursoProjetoType, { nullable: true }) projeto?: ProjetoRecursoProjetoType | null;
  @Field() pendenteVinculo!: boolean;
  @Field(() => Int) planejadoMinutos!: number;
  @Field(() => Int) saldoMinutos!: number;
  @Field() sobreplanejada!: boolean;
  @Field(() => [ProjetoTarefaTaxaHistoricoType]) taxas!: ProjetoTarefaTaxaHistoricoType[];
}

@ObjectType()
export class ProjetoTarefaPermissoesType {
  @Field() podeIncluir!: boolean;
  @Field() podeAlterar!: boolean;
  @Field() podeExcluir!: boolean;
}

@ObjectType()
export class ProjetoTarefaPainelType {
  @Field(() => [ProjetoTarefaType]) tarefas!: ProjetoTarefaType[];
  @Field(() => [ProjetoTarefaRecursoType]) recursos!: ProjetoTarefaRecursoType[];
  @Field(() => ProjetoTarefaPermissoesType) permissoes!: ProjetoTarefaPermissoesType;
}
