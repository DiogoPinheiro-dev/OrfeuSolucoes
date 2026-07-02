import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoAnexoType {
  @Field()
  id!: string;

  @Field()
  chamadoId!: string;

  @Field(() => String, { nullable: true })
  mensagemId?: string | null;

  @Field()
  autorId!: string;

  @Field(() => String, { nullable: true })
  autorNome?: string | null;

  @Field()
  nomeOriginal!: string;

  @Field()
  mimeType!: string;

  @Field(() => Int)
  tamanho!: number;

  @Field()
  downloadUrl!: string;

  @Field(() => Date)
  criadoEm!: Date;
}
