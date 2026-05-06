import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

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
}
