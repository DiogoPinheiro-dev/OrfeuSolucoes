import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoNotificacaoType {
  @Field(() => String)
  id!: string;
  @Field(() => String)
  chamadoId!: string;
  @Field(() => Int)
  chamadoNumero!: number;
  @Field(() => String)
  chamadoTitulo!: string;
  @Field(() => String)
  tipo!: string;
  @Field(() => String)
  titulo!: string;
  @Field(() => String)
  mensagem!: string;
  @Field(() => Date, { nullable: true })
  lidaEm?: Date | null;
  @Field(() => Date)
  criadoEm!: Date;
}