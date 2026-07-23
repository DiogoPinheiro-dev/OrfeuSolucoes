import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min
} from 'class-validator';
import {
  ProjetoItemPrioridade,
  ProjetoItemStatus,
  ProjetoItemTipo
} from '../types/projeto-item.types';

@InputType()
export class ProjetoItemFiltroInput {
  @Field()
  @IsUUID()
  projetoId!: string;

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

  @Field(() => ProjetoItemTipo, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoItemTipo)
  tipo?: ProjetoItemTipo | null;

  @Field(() => ProjetoItemStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoItemStatus)
  status?: ProjetoItemStatus | null;

  @Field(() => ProjetoItemPrioridade, { nullable: true })
  @IsOptional()
  @IsEnum(ProjetoItemPrioridade)
  prioridade?: ProjetoItemPrioridade | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  incluirArquivados?: boolean;
}
