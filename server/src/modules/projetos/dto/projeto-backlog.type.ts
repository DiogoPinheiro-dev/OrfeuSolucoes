import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProjetoBacklogProjetoType {
  @Field()
  id!: string;

  @Field()
  chave!: string;

  @Field()
  nome!: string;

  @Field(() => Date, { nullable: true })
  arquivadoEm?: Date | null;
}

@ObjectType()
export class ProjetoBacklogMovimentoType {
  @Field()
  itemId!: string;

  @Field(() => Int)
  backlogVersao!: number;
}

@ObjectType()
export class ProjetoBacklogPaiCandidatoType {
  @Field()
  id!: string;

  @Field()
  chave!: string;

  @Field()
  titulo!: string;

  @Field(() => String, { nullable: true })
  paiId?: string | null;

  @Field(() => Int)
  nivel!: number;

  @Field()
  trilha!: string;
}
