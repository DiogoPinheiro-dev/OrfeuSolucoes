import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { ProjetoSaude } from '../types/projeto.types';

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