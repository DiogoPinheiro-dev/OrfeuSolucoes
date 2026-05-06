import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateGrupoUsuarioInput {
  @Field()
  @IsString()
  nome!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descricao?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  acessoEcommerce?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  acessoProjetos?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  acessoHoras?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  acessoConfigurador?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  podeVisualizar?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  podeIncluir?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  podeAlterar?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
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
}
