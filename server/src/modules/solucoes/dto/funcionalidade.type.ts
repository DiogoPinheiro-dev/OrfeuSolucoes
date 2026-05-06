import { Field, Int, ObjectType } from '@nestjs/graphql';

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
}
