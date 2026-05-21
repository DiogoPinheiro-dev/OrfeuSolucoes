import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class FuncionalidadeAcaoInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field()
  @IsString()
  chave!: string;

  @Field()
  @IsString()
  nome!: string;

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

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  acaoPadrao?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  configuracao?: string | null;
}
