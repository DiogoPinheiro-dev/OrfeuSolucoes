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
  MinLength,
  ValidateNested
} from 'class-validator';
import {
  PROJETO_APONTAMENTO_MOTIVO_MAXIMO,
  PROJETO_APONTAMENTO_MOTIVO_MINIMO
} from '../policies/projeto-apontamento-limite.policy';
import { PROJETO_PAGINACAO } from '../projeto-periodo.service';
import { ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';
import { DATA_DE_CALENDARIO, VersionarProjetoApontamentoInput } from './projeto-apontamento.input';

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;
const CHAVE_DE_IDEMPOTENCIA_MAXIMA = 100;

@InputType()
export class ProjetoHorasFiltroInput {
  @Field() @IsUUID() projetoId!: string;
  @Field({ description: 'Primeiro dia do período, no formato YYYY-MM-DD.' }) @Matches(DATA_DE_CALENDARIO) inicio!: string;
  @Field({ description: 'Último dia do período, no formato YYYY-MM-DD.' }) @Matches(DATA_DE_CALENDARIO) fim!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() usuarioId?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() itemId?: string | null;
  @Field(() => ProjetoApontamentoStatus, { nullable: true }) @IsOptional() @IsEnum(ProjetoApontamentoStatus) status?: ProjetoApontamentoStatus | null;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() faturavel?: boolean | null;
  @Field(() => Int, { nullable: true, defaultValue: 1 }) @IsOptional() @IsInt() @Min(1) pagina?: number;
  @Field(() => Int, { nullable: true, defaultValue: 20 }) @IsOptional() @IsInt() @Min(1) @Max(PROJETO_PAGINACAO.limiteMaximo) limite?: number;
}

@InputType()
export class AprovarProjetoApontamentosInput {
  @Field() @IsUUID() projetoId!: string;

  @Field(() => [VersionarProjetoApontamentoInput])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(PROJETO_PAGINACAO.limiteMaximo)
  @ArrayUnique((apontamento: VersionarProjetoApontamentoInput) => apontamento.id)
  @ValidateNested({ each: true })
  @Type(() => VersionarProjetoApontamentoInput)
  apontamentos!: VersionarProjetoApontamentoInput[];

  @Field({ description: 'Chave gerada pela tela; repetir o mesmo lote com ela não decide os apontamentos de novo.' })
  @IsString()
  @MinLength(1)
  @MaxLength(CHAVE_DE_IDEMPOTENCIA_MAXIMA)
  chaveIdempotencia!: string;
}

@InputType()
export class RejeitarProjetoApontamentosInput extends AprovarProjetoApontamentosInput {
  @Field({ description: 'Motivo da rejeição, visível para o autor.' })
  @IsString()
  @MinLength(PROJETO_APONTAMENTO_MOTIVO_MINIMO)
  @MaxLength(PROJETO_APONTAMENTO_MOTIVO_MAXIMO)
  motivo!: string;
}

@InputType()
export class ReabrirProjetoApontamentoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;

  @Field({ description: 'Motivo da reabertura, visível para o autor.' })
  @IsString()
  @MinLength(PROJETO_APONTAMENTO_MOTIVO_MINIMO)
  @MaxLength(PROJETO_APONTAMENTO_MOTIVO_MAXIMO)
  motivo!: string;
}

@InputType()
export class FecharProjetoApontamentoPeriodoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field({ description: 'Mês de referência, no formato YYYY-MM.' }) @Matches(COMPETENCIA) competencia!: string;
}

@InputType()
export class ReabrirProjetoApontamentoPeriodoInput extends FecharProjetoApontamentoPeriodoInput {
  @Field(() => Int) @IsInt() @Min(1) versao!: number;

  @Field({ description: 'Motivo da reabertura da competência.' })
  @IsString()
  @MinLength(PROJETO_APONTAMENTO_MOTIVO_MINIMO)
  @MaxLength(PROJETO_APONTAMENTO_MOTIVO_MAXIMO)
  motivo!: string;
}

@InputType()
export class RecalcularCustoProjetoApontamentosInput {
  @Field() @IsUUID() projetoId!: string;
}
