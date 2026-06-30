import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AtendenteChamadoType {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field(() => String, { nullable: true })
  login?: string | null;

  @Field()
  email!: string;
}
