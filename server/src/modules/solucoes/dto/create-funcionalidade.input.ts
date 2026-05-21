import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FuncionalidadeAcaoInput } from './funcionalidade-acao.input';

@InputType()
export class CreateFuncionalidadeInput {
  @Field(() => Int)
  @IsInt()
  solucaoId!: number;

  @Field()
  @IsString()
  slug!: string;

  @Field()
  @IsString()
  titulo!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  label?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  ordem?: number;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  registryKey?: string | null;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  somenteAdminSistema?: boolean;

  @Field(() => [FuncionalidadeAcaoInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionalidadeAcaoInput)
  acoes?: FuncionalidadeAcaoInput[];
}
