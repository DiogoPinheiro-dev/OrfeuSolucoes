import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min
} from 'class-validator';
import { ProjetoCronogramaAgrupamento } from '../types/projeto-cronograma.types';

@InputType()
export class ProjetoCronogramaFiltroInput {
  @Field()
  @IsUUID()
  projetoId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  inicioEm?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  fimEm?: string;

  @Field(() => ProjetoCronogramaAgrupamento, {
    nullable: true,
    defaultValue: ProjetoCronogramaAgrupamento.NENHUM
  })
  @IsOptional()
  @IsEnum(ProjetoCronogramaAgrupamento)
  agrupamento?: ProjetoCronogramaAgrupamento;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  incluirDependenciasArquivadas?: boolean;
}

@InputType()
export class CreateProjetoItemDependenciaInput {
  @Field()
  @IsUUID()
  projetoId!: string;

  @Field()
  @IsUUID()
  bloqueadorId!: string;

  @Field()
  @IsUUID()
  bloqueadoId!: string;
}

@InputType()
export class VersionarProjetoItemDependenciaInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;
}

@InputType()
export class UpdateProjetoCronogramaItemDatasInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  inicioPrevistoEm?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  fimPrevistoEm?: string | null;
}
