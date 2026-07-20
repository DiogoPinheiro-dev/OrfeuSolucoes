import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjetoSaude, ProjetoSituacao } from '../types/projeto.types';

@InputType()
export class AtualizarCicloProjetoInput {
  @Field()
  @IsUUID()
  projetoId!: string;

  @Field(() => ProjetoSituacao, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoSituacao)
  situacao?: ProjetoSituacao;

  @Field(() => ProjetoSaude, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoSaude)
  saude?: ProjetoSaude;
}
