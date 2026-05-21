import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FuncionalidadeAcaoPermissaoType {
  @Field(() => Int)
  funcionalidadeId!: number;

  @Field(() => Int)
  acaoId!: number;

  @Field()
  chave!: string;

  @Field()
  permitido!: boolean;
}
