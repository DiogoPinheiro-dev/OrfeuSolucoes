import { Field, InputType, Int } from '@nestjs/graphql';
import { ProjetoMetodologia, ProjetoSaude, ProjetoSituacao } from '../types/projeto.types';

@InputType()
export class ProjetoFiltroInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  pagina?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limite?: number;

  @Field(() => String, { nullable: true })
  termo?: string;

  @Field(() => ProjetoMetodologia, { nullable: true })
  metodologia?: ProjetoMetodologia;

  @Field(() => ProjetoSituacao, { nullable: true })
  situacao?: ProjetoSituacao;

  @Field(() => ProjetoSaude, { nullable: true })
  saude?: ProjetoSaude;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  incluirArquivados?: boolean;
}
