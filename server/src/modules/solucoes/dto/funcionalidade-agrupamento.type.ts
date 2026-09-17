import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FuncionalidadeAgrupamentoType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  solucaoId!: number;

  @Field()
  slug!: string;

  @Field()
  titulo!: string;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => Int)
  ordem!: number;

  @Field()
  ativo!: boolean;

  @Field()
  padraoSistema!: boolean;

  @Field()
  chaveTecnica!: string;
}
