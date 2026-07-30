import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoRecursoProjetoType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() nome!: string;
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
}

@ObjectType()
export class ProjetoRecursoVinculoType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoRecursoProjetoType) projeto!: ProjetoRecursoProjetoType;
}

@ObjectType()
export class ProjetoRecursoType {
  @Field() id!: string;
  @Field() usuarioId!: string;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
  @Field(() => [ProjetoRecursoVinculoType]) projetos!: ProjetoRecursoVinculoType[];
}

@ObjectType()
export class ProjetoRecursoPermissoesType {
  @Field() podeIncluir!: boolean;
  @Field() podeAlterar!: boolean;
  @Field() podeExcluir!: boolean;
}

@ObjectType()
export class ProjetoRecursoPainelType {
  @Field(() => [ProjetoUsuarioType]) candidatos!: ProjetoUsuarioType[];
  @Field(() => [ProjetoRecursoType]) recursos!: ProjetoRecursoType[];
  @Field(() => ProjetoRecursoPermissoesType) permissoes!: ProjetoRecursoPermissoesType;
}
