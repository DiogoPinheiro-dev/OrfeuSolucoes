import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ProjetoSaude } from '../types/projeto.types';

@InputType()
export class ProjetoComunicacaoFeedFiltroInput {
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
}

@InputType()
export class CreateProjetoAtualizacaoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(5000) conteudo!: string;
  @Field(() => ProjetoSaude, { nullable: true }) @IsOptional() @IsEnum(ProjetoSaude) saudePercebida?: ProjetoSaude | null;
}

@InputType()
export class UpdateProjetoAtualizacaoInput extends CreateProjetoAtualizacaoInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class CreateProjetoComentarioInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(3000) conteudo!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() atualizacaoId?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() itemId?: string | null;
}

@InputType()
export class UpdateProjetoComentarioInput {
  @Field() @IsUUID() id!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(3000) conteudo!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class ExcluirProjetoComentarioInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}