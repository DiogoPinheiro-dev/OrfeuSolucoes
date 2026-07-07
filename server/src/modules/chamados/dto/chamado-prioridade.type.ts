import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoPrioridadeType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  empresaId!: number;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => String, { nullable: true })
  cor?: string | null;

  @Field(() => Int)
  ordem!: number;

  @Field()
  ativo!: boolean;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;
}
