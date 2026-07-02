import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AtendenteChamadoType {
  @Field()
  id!: string;

  @Field()
  tipo!: string;

  @Field(() => String, { nullable: true })
  usuarioId?: string | null;

  @Field(() => Int, { nullable: true })
  grupoId?: number | null;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field(() => String, { nullable: true })
  login?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;
}