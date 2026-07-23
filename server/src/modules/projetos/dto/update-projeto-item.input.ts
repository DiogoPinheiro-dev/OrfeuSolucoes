import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import {
  ProjetoItemPrioridade,
  ProjetoItemTipo
} from '../types/projeto-item.types';

@InputType()
export class UpdateProjetoItemInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;

  @Field(() => ProjetoItemTipo, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoItemTipo)
  tipo?: ProjetoItemTipo;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titulo?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descricao?: string | null;

  @Field(() => ProjetoItemPrioridade, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoItemPrioridade)
  prioridade?: ProjetoItemPrioridade;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  paiId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  inicioPrevistoEm?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  fimPrevistoEm?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  estimativaMinutos?: number | null;
}
