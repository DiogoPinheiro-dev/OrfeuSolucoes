import { Type } from 'class-transformer';
import { Field, InputType, Int } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';
import {
  PROJETO_APONTAMENTO_DESCRICAO_MAXIMA,
  PROJETO_APONTAMENTO_MINUTOS_POR_DIA
} from '../policies/projeto-apontamento-limite.policy';
import { PROJETO_PAGINACAO } from '../projeto-periodo.service';
import { ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';

export const DATA_DE_CALENDARIO = /^\d{4}-\d{2}-\d{2}$/;

@InputType()
export class SalvarProjetoApontamentoInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsUUID() projetoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() itemId?: string | null;
  @Field({ description: 'Dia do trabalho, no formato YYYY-MM-DD.' }) @Matches(DATA_DE_CALENDARIO) data!: string;
  @Field(() => Int) @IsInt() @Min(1) @Max(PROJETO_APONTAMENTO_MINUTOS_POR_DIA) minutos!: number;
  @Field() @IsString() @MaxLength(PROJETO_APONTAMENTO_DESCRICAO_MAXIMA) descricao!: string;
  @Field() @IsBoolean() faturavel!: boolean;
}

@InputType()
export class VersionarProjetoApontamentoInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class EnviarProjetoApontamentosInput {
  @Field(() => [VersionarProjetoApontamentoInput])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(PROJETO_PAGINACAO.limiteMaximo)
  @ArrayUnique((apontamento: VersionarProjetoApontamentoInput) => apontamento.id)
  @ValidateNested({ each: true })
  @Type(() => VersionarProjetoApontamentoInput)
  apontamentos!: VersionarProjetoApontamentoInput[];
}

@InputType()
export class MeusProjetoApontamentosFiltroInput {
  @Field({ description: 'Primeiro dia do período, no formato YYYY-MM-DD.' }) @Matches(DATA_DE_CALENDARIO) inicio!: string;
  @Field({ description: 'Último dia do período, no formato YYYY-MM-DD.' }) @Matches(DATA_DE_CALENDARIO) fim!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() projetoId?: string | null;
  @Field(() => ProjetoApontamentoStatus, { nullable: true }) @IsOptional() @IsEnum(ProjetoApontamentoStatus) status?: ProjetoApontamentoStatus | null;
  @Field(() => Int, { nullable: true, defaultValue: 1 }) @IsOptional() @IsInt() @Min(1) pagina?: number;
  @Field(() => Int, { nullable: true, defaultValue: 20 }) @IsOptional() @IsInt() @Min(1) @Max(PROJETO_PAGINACAO.limiteMaximo) limite?: number;
}
