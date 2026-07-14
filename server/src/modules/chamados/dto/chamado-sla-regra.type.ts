import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoSlaRegraType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  empresaId!: number;

  @Field(() => Int)
  prioridadeId!: number;

  @Field()
  prioridadeNome!: string;

  @Field(() => Int)
  primeiraRespostaPrazoMinutos!: number;

  @Field(() => Int)
  resolucaoPrazoMinutos!: number;

  @Field()
  modoContagem!: string;

  @Field()
  ativo!: boolean;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;
}
