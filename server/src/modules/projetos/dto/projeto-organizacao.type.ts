import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';
import { ProjetoRecursoPermissoesType, ProjetoRecursoProjetoType } from './projeto-recurso.type';

@ObjectType()
export class CapacitacaoType {
  @Field() id!: string;
  @Field() nome!: string;
  @Field(() => String, { nullable: true }) descricao?: string | null;
  @Field(() => Int) nivelHierarquico!: number;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
}

@ObjectType()
export class OrganizacaoRecursoType {
  @Field() id!: string;
  @Field() usuarioId!: string;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
  @Field(() => CapacitacaoType, { nullable: true }) capacitacao?: CapacitacaoType | null;
}

@ObjectType()
export class EquipeType {
  @Field() id!: string;
  @Field() nome!: string;
  @Field(() => String, { nullable: true }) descricao?: string | null;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field(() => [OrganizacaoRecursoType]) recursos!: OrganizacaoRecursoType[];
  @Field(() => [ProjetoRecursoProjetoType]) projetos!: ProjetoRecursoProjetoType[];
}

@ObjectType()
export class ProjetoOrganizacaoPainelType {
  @Field(() => [ProjetoUsuarioType]) candidatos!: ProjetoUsuarioType[];
  @Field(() => [CapacitacaoType]) capacitacoes!: CapacitacaoType[];
  @Field(() => [EquipeType]) equipes!: EquipeType[];
  @Field(() => [OrganizacaoRecursoType]) recursos!: OrganizacaoRecursoType[];
  @Field(() => [ProjetoRecursoProjetoType]) projetos!: ProjetoRecursoProjetoType[];
  @Field(() => ProjetoRecursoPermissoesType) permissoes!: ProjetoRecursoPermissoesType;
}
