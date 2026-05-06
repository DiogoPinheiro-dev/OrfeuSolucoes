import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateEmpresaInput {
  @Field(() => Int)
  @IsInt()
  id!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  nome?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  acessoEcommerce?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  acessoProjetos?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  acessoHoras?: boolean;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  solucaoIds?: number[];

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  funcionalidadeIds?: number[];
}
