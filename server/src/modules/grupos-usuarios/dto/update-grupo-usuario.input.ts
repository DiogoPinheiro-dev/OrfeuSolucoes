import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FuncionalidadePermissaoInput } from './funcionalidade-permissao.input';

@InputType()
export class UpdateGrupoUsuarioInput {
  @Field(() => Int)
  @IsInt()
  id!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  nome?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descricao?: string;

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

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  acessoConfigurador?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  podeVisualizar?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  podeIncluir?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  podeAlterar?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  podeExcluir?: boolean;

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

  @Field(() => [FuncionalidadePermissaoInput], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionalidadePermissaoInput)
  @IsOptional()
  funcionalidadePermissoes?: FuncionalidadePermissaoInput[];
}
