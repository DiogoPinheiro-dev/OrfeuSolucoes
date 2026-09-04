import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FuncionalidadeType } from './funcionalidade.type';

@ObjectType()
export class SolucaoType {
  @Field(() => Int)
  id!: number;

  @Field()
  slug!: string;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => String, { nullable: true })
  eyebrow?: string | null;

  @Field()
  ordem!: number;

  @Field()
  ativo!: boolean;

  @Field()
  exibirNoHub!: boolean;

  @Field()
  somenteAdminSistema!: boolean;

  @Field()
  padraoSistema!: boolean;

  @Field()
  chaveTecnica!: string;

  @Field()
  statusPublicacao!: string;

  @Field(() => Int)
  revisaoCatalogo!: number;

  @Field(() => [FuncionalidadeType])
  funcionalidades!: FuncionalidadeType[];
}
