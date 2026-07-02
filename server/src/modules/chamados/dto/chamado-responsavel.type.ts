import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoResponsavelFuncionalidadeType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  funcionalidadeId!: number;

  @Field()
  funcionalidadeNome!: string;

  @Field()
  ativo!: boolean;
}

@ObjectType()
export class ChamadoResponsavelSolucaoType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  solucaoId!: number;

  @Field()
  solucaoNome!: string;

  @Field()
  responsavelGeral!: boolean;

  @Field()
  ativo!: boolean;

  @Field(() => [ChamadoResponsavelFuncionalidadeType])
  funcionalidades!: ChamadoResponsavelFuncionalidadeType[];
}

@ObjectType()
export class ChamadoResponsavelType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  empresaId!: number;

  @Field()
  tipo!: string;

  @Field(() => String, { nullable: true })
  usuarioId?: string | null;

  @Field(() => String, { nullable: true })
  usuarioNome?: string | null;

  @Field(() => String, { nullable: true })
  usuarioEmail?: string | null;

  @Field(() => Int, { nullable: true })
  grupoId?: number | null;

  @Field(() => String, { nullable: true })
  grupoNome?: string | null;

  @Field(() => String, { nullable: true })
  responsavelNome?: string | null;

  @Field()
  ativo!: boolean;

  @Field(() => [ChamadoResponsavelSolucaoType])
  solucoes!: ChamadoResponsavelSolucaoType[];

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;
}

@ObjectType()
export class ChamadoResponsavelUsuarioOptionType {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field(() => String, { nullable: true })
  login?: string | null;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  grupoNome?: string | null;
}

@ObjectType()
export class ChamadoResponsavelGrupoOptionType {
  @Field(() => Int)
  id!: number;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => Int)
  usuariosCount!: number;
}

@ObjectType()
export class ChamadoResponsavelFuncionalidadeOptionType {
  @Field(() => Int)
  id!: number;

  @Field()
  titulo!: string;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field()
  slug!: string;
}

@ObjectType()
export class ChamadoResponsavelSolucaoOptionType {
  @Field(() => Int)
  id!: number;

  @Field()
  nome!: string;

  @Field()
  slug!: string;

  @Field(() => [ChamadoResponsavelFuncionalidadeOptionType])
  funcionalidades!: ChamadoResponsavelFuncionalidadeOptionType[];
}

@ObjectType()
export class ChamadoResponsavelOptionsType {
  @Field(() => [ChamadoResponsavelUsuarioOptionType])
  usuarios!: ChamadoResponsavelUsuarioOptionType[];

  @Field(() => [ChamadoResponsavelGrupoOptionType])
  grupos!: ChamadoResponsavelGrupoOptionType[];

  @Field(() => [ChamadoResponsavelSolucaoOptionType])
  solucoes!: ChamadoResponsavelSolucaoOptionType[];
}