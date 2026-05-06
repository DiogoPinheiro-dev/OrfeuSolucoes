import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

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
}
