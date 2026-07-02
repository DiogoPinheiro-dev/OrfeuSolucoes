import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoAcompanhanteType {
  @Field()
  id!: string;

  @Field()
  chamadoId!: string;

  @Field()
  usuarioId!: string;

  @Field(() => String, { nullable: true })
  usuarioNome?: string | null;

  @Field(() => String, { nullable: true })
  usuarioLogin?: string | null;

  @Field(() => String, { nullable: true })
  usuarioEmail?: string | null;

  @Field(() => String, { nullable: true })
  adicionadoPorId?: string | null;

  @Field(() => String, { nullable: true })
  adicionadoPorNome?: string | null;

  @Field()
  ativo!: boolean;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;
}