import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class ChamadoRelatorioFiltroInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsDateString() criadoDe?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsDateString() criadoAte?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() responsavelId?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() categoriaId?: number | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() prioridadeId?: number | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(['SEM_SLA', 'NO_PRAZO', 'PERTO_DO_VENCIMENTO', 'ATRASADO', 'PAUSADO']) slaStatus?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() status?: string | null;
  @Field(() => Int, { nullable: true, defaultValue: 1 }) @IsOptional() @IsInt() @Min(1) page?: number;
  @Field(() => Int, { nullable: true, defaultValue: 50 }) @IsOptional() @IsInt() @Min(1) @Max(200) pageSize?: number;
}