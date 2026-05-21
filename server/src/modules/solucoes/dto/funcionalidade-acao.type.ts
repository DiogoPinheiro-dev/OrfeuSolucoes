import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FuncionalidadeAcaoType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  funcionalidadeId!: number;

  @Field()
  chave!: string;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => Int)
  ordem!: number;

  @Field()
  ativo!: boolean;

  @Field()
  acaoPadrao!: boolean;

  @Field(() => String, { nullable: true })
  configuracao?: string | null;

  @Field()
  permitido!: boolean;
}
