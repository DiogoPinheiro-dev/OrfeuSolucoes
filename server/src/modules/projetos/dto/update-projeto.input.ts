import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ProjetoMetodologia } from '../types/projeto.types';

@InputType()
export class UpdateProjetoInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome?: string;

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

  @Field(() => ProjetoMetodologia, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoMetodologia)
  metodologia?: ProjetoMetodologia;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  inicioPrevistoEm?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  fimPrevistoEm?: string | null;
}
