import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProjetoMetodologia, ProjetoSaude, ProjetoSituacao } from '../types/projeto.types';

@InputType()
export class ProjetoFiltroInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pagina?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  termo?: string | null;

  @Field(() => ProjetoMetodologia, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoMetodologia)
  metodologia?: ProjetoMetodologia | null;

  @Field(() => ProjetoSituacao, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoSituacao)
  situacao?: ProjetoSituacao | null;

  @Field(() => ProjetoSaude, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoSaude)
  saude?: ProjetoSaude | null;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  incluirArquivados?: boolean;
}
