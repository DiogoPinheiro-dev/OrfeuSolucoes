import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoCategoriaType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  empresaId!: number;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field()
  ativo!: boolean;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;
}
