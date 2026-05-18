import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FuncionalidadePermissaoType {
  @Field(() => Int)
  funcionalidadeId!: number;

  @Field()
  podeVisualizar!: boolean;

  @Field()
  podeIncluir!: boolean;

  @Field()
  podeAlterar!: boolean;

  @Field()
  podeExcluir!: boolean;
}
