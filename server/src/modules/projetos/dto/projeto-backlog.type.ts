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

