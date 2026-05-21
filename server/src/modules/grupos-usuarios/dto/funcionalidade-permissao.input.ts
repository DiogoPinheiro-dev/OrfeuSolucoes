import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { FuncionalidadeAcaoPermissaoInput } from './funcionalidade-acao-permissao.input';

@InputType()
export class FuncionalidadePermissaoInput {
  @Field(() => Int)
  @IsInt()
  funcionalidadeId!: number;

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

  @Field(() => [FuncionalidadeAcaoPermissaoInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionalidadeAcaoPermissaoInput)
  acoes?: FuncionalidadeAcaoPermissaoInput[];
}
