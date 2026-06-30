import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  prioridade?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  responsavelId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoriaId?: number | null;

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
