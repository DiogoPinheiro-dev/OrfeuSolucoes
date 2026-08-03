import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { ProjetoCustoTipo } from '../types/projeto-orcamento.types';

const MONEY = /^\d{1,16}(\.\d{1,4})?$/;

@InputType()
export class SalvarProjetoOrcamentoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsString() @Matches(/^[A-Z]{3}$/) moeda!: string;
}

@InputType()
export class SalvarProjetoOrcamentoCategoriaInput {
  @Field() @IsUUID() projetoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsString() @MinLength(1) @MaxLength(120) nome!: string;
  @Field() @Matches(MONEY) valorPlanejado!: string;
  @Field() @Matches(MONEY) valorComprometido!: string;
  @Field() @Matches(MONEY) valorRealizado!: string;
}

@InputType()
export class SalvarProjetoCustoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() categoriaId?: string | null;
  @Field(() => ProjetoCustoTipo) @IsEnum(ProjetoCustoTipo) tipo!: ProjetoCustoTipo;
  @Field() @IsString() @MinLength(1) @MaxLength(240) descricao!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() recursoId?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() tarefaId?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) quantidadeMinutos?: number | null;
  @Field(() => String, { nullable: true }) @IsOptional() @Matches(MONEY) taxaHora?: string | null;
  @Field() @Matches(MONEY) valorPlanejado!: string;
  @Field() @Matches(MONEY) valorComprometido!: string;
  @Field() @Matches(MONEY) valorRealizado!: string;
}

@InputType()
export class AprovarProjetoOrcamentoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class ExcluirProjetoOrcamentoItemInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
