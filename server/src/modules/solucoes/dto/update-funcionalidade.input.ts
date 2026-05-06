import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateFuncionalidadeInput {
  @Field(() => Int)
  @IsInt()
  id!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  solucaoId?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  titulo?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  label?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  ordem?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  registryKey?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  somenteAdminSistema?: boolean;
}
