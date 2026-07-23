import { Field, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoItemHistoricoType {
  @Field()
  id!: string;

  @Field()
  evento!: string;

  @Field(() => String, { nullable: true })
  dados?: string | null;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => ProjetoUsuarioType, { nullable: true })
  usuario?: ProjetoUsuarioType | null;
}
