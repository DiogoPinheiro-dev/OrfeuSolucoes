import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf
} from 'class-validator';
import { ProjetoSprintDestinoIncompletos } from '../types/projeto-sprint.types';

@InputType()
export class CreateProjetoSprintInput {
  @Field()
  @IsUUID()
  projetoId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nome!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  objetivo?: string | null;

  @Field()
  @IsDateString()
  inicioPrevistoEm!: string;

  @Field()
  @IsDateString()
  fimPrevistoEm!: string;
}

@InputType()
export class UpdateProjetoSprintInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nome!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  objetivo?: string | null;

  @Field()
  @IsDateString()
  inicioPrevistoEm!: string;

  @Field()
  @IsDateString()
  fimPrevistoEm!: string;
}

@InputType()
export class AlterarEscopoProjetoSprintInput {
  @Field()
  @IsUUID()
  sprintId!: string;

  @Field()
  @IsUUID()
  itemId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;
}

@InputType()
export class TransicionarProjetoSprintInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;
}

@InputType()
export class ConcluirProjetoSprintInput extends TransicionarProjetoSprintInput {
  @Field(() => ProjetoSprintDestinoIncompletos)
  @IsEnum(ProjetoSprintDestinoIncompletos)
  destinoIncompletos!: ProjetoSprintDestinoIncompletos;

  @Field(() => String, { nullable: true })
  @ValidateIf(
    (value: ConcluirProjetoSprintInput) =>
      value.destinoIncompletos === ProjetoSprintDestinoIncompletos.SPRINT
  )
  @IsUUID()
  sprintDestinoId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultado?: string | null;
}
