import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DocumentacaoItemType {
  @Field() id!: string;
  @Field() slug!: string;
  @Field() titulo!: string;
  @Field() resumo!: string;
  @Field() categoria!: string;
  @Field() audiencia!: string;
  @Field(() => Int) ordem!: number;
  @Field() validadoEm!: string;
  @Field(() => [String]) palavrasChave!: string[];
  @Field(() => String, { nullable: true }) solucao?: string;
  @Field(() => String, { nullable: true }) funcionalidade?: string;
  @Field(() => String, { nullable: true }) registryKey?: string;
}

@ObjectType()
export class DocumentacaoArtigoType extends DocumentacaoItemType {
  @Field() conteudo!: string;
}

@ObjectType()
export class DocumentacaoBuscaResultadoType extends DocumentacaoItemType {
  @Field() trecho!: string;
}
