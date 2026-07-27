import { Field, InputType, Int } from '@nestjs/graphql';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import {
  ProjetoEntregaStatus,
  ProjetoMarcoStatus
} from '../types/projeto-marco-entrega.types';

@InputType()
export class CreateProjetoMarcoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(160) nome!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(1000) descricao?: string | null;
  @Field() @IsUUID() responsavelId!: string;
  @Field(() => ProjetoMarcoStatus) @IsEnum(ProjetoMarcoStatus) status!: ProjetoMarcoStatus;
  @Field() @IsDateString() dataPrevistaEm!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsDateString() dataRealizadaEm?: string | null;
  @Field(() => [String], { defaultValue: [] }) @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) itemIds!: string[];
}

@InputType()
export class UpdateProjetoMarcoInput extends CreateProjetoMarcoInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class CreateProjetoEntregaInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(160) nome!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(1500) resultadoEsperado!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(3000) criteriosAceite!: string;
  @Field() @IsUUID() responsavelId!: string;
  @Field(() => ProjetoEntregaStatus) @IsEnum(ProjetoEntregaStatus) status!: ProjetoEntregaStatus;
  @Field() @IsDateString() inicioPrevistoEm!: string;
  @Field() @IsDateString() fimPrevistoEm!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsDateString() concluidaEm?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() marcoId?: string | null;
  @Field(() => [String], { defaultValue: [] }) @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) itemIds!: string[];
}

@InputType()
export class UpdateProjetoEntregaInput extends CreateProjetoEntregaInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class VersionarProjetoCompromissoInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
