import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class FuncionalidadeAcaoPermissaoInput {
  @Field(() => Int)
  @IsInt()
  funcionalidadeId!: number;

  @Field(() => Int)
  @IsInt()
  acaoId!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  chave?: string | null;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  permitido?: boolean;
}
