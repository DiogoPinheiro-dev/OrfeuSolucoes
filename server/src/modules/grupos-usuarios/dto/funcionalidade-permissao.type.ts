import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FuncionalidadeAcaoPermissaoType } from './funcionalidade-acao-permissao.type';

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

  @Field(() => [FuncionalidadeAcaoPermissaoType])
  acoes!: FuncionalidadeAcaoPermissaoType[];
}
