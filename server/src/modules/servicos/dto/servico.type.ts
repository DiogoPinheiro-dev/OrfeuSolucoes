import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ServicoType {
  @Field(() => Int)
  id!: number;

  @Field(() => String, { nullable: true })
  titulo?: string | null;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => Float, { nullable: true })
  valor?: number | null;

  @Field(() => Float, { nullable: true })
  desconto?: number | null;

  @Field(() => Int, { nullable: true })
  vendas?: number | null;
}
