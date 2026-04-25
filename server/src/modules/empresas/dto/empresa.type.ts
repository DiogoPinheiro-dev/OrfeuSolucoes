import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EmpresaType {
  @Field(() => Int)
  id!: number;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field()
  acessoEcommerce!: boolean;

  @Field()
  acessoProjetos!: boolean;

  @Field()
  acessoHoras!: boolean;
}
