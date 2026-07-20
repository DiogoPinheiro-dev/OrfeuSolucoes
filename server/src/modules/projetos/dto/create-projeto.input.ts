import { Type } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested
} from 'class-validator';
import { ProjetoMetodologia, ProjetoPapel, ProjetoSaude, ProjetoSituacao } from '../types/projeto.types';

@InputType()
export class ProjetoMembroInput {
  @Field()
  @IsUUID()
  usuarioId!: string;

  @Field(() => ProjetoPapel)
  @IsEnum(ProjetoPapel)
  papel!: ProjetoPapel;
}

@InputType()
export class CreateProjetoInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  chave!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  objetivo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string | null;

  @Field(() => ProjetoMetodologia)
  @IsEnum(ProjetoMetodologia)
  metodologia!: ProjetoMetodologia;

  @Field(() => ProjetoSituacao, { nullable: true, defaultValue: ProjetoSituacao.RASCUNHO })
  @IsOptional()
  @IsEnum(ProjetoSituacao)
  situacao?: ProjetoSituacao;

  @Field(() => ProjetoSaude, { nullable: true, defaultValue: ProjetoSaude.EM_DIA })
  @IsOptional()
  @IsEnum(ProjetoSaude)
  saude?: ProjetoSaude;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  inicioPrevistoEm?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  fimPrevistoEm?: string | null;

  @Field()
  @IsUUID()
  responsavelId!: string;

  @Field(() => [ProjetoMembroInput], { nullable: true, defaultValue: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: ProjetoMembroInput) => item.usuarioId)
  @ValidateNested({ each: true })
  @Type(() => ProjetoMembroInput)
  participantes?: ProjetoMembroInput[];
}
