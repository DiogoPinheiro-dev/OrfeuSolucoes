import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FuncionalidadeAcaoType } from './funcionalidade-acao.type';

@ObjectType()
export class FuncionalidadeType {
  @Field(() => Int)
  id!: number;

  @Field()
  slug!: string;

  @Field()
  titulo!: string;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field()
  ordem!: number;

  @Field()
  ativo!: boolean;

  @Field(() => String, { nullable: true })
  registryKey?: string | null;

  @Field()
  somenteAdminSistema!: boolean;

  @Field()
  podeVisualizar!: boolean;

  @Field()
  podeIncluir!: boolean;

  @Field()
  podeAlterar!: boolean;

  @Field()
  podeExcluir!: boolean;

  @Field(() => [FuncionalidadeAcaoType])
  acoes!: FuncionalidadeAcaoType[];
}
