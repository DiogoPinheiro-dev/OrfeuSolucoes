import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { SLA_MODO_CONTAGEM } from '../constants/chamado.constants';

@InputType()
export class CreateChamadoSlaRegraInput {
  @Field(() => Int)
  @IsInt()
  prioridadeId!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  primeiraRespostaPrazoMinutos!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  resolucaoPrazoMinutos!: number;

  @Field(() => String, { nullable: true, defaultValue: 'CORRIDO' })
  @IsOptional()
  @IsIn(SLA_MODO_CONTAGEM)
  modoContagem?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

@InputType()
export class UpdateChamadoSlaRegraInput {
  @Field(() => Int)
  @IsInt()
  id!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  prioridadeId?: number | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  primeiraRespostaPrazoMinutos?: number | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  resolucaoPrazoMinutos?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(SLA_MODO_CONTAGEM)
  modoContagem?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean | null;
}
