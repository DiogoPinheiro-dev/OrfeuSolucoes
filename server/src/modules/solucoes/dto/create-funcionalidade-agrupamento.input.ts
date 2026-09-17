import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateFuncionalidadeAgrupamentoInput {
  @Field(() => Int)
  @IsInt()
  solucaoId!: number;

  @Field()
  @IsString()
  @MaxLength(200)
  slug!: string;

  @Field()
  @IsString()
  @MaxLength(200)
  titulo!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  ordem?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
