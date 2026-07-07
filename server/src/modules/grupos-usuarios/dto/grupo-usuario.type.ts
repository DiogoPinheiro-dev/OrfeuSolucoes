import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FuncionalidadePermissaoType } from './funcionalidade-permissao.type';

@ObjectType()
export class GrupoUsuarioType {
  @Field(() => Int)
  id!: number;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field()
  acessoEcommerce!: boolean;

  @Field()
  acessoProjetos!: boolean;

  @Field()
  acessoHoras!: boolean;

  @Field()
  acessoConfigurador!: boolean;

  @Field()
  padraoSistema!: boolean;

  @Field()
  podeVisualizar!: boolean;

  @Field()
  podeIncluir!: boolean;

  @Field()
  podeAlterar!: boolean;

  @Field()
  podeExcluir!: boolean;

  @Field(() => [Int])
  solucaoIds!: number[];

  @Field(() => [Int])
  funcionalidadeIds!: number[];

  @Field(() => [FuncionalidadePermissaoType])
  funcionalidadePermissoes!: FuncionalidadePermissaoType[];
}
