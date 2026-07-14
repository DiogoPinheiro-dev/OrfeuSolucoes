import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class ChamadoFiltroInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  termo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  status?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  prioridadeId?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  responsavelGrupoId?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  solicitanteId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoriaId?: number | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  somenteAtrasados?: boolean | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  criadoDe?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  criadoAte?: string | null;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
