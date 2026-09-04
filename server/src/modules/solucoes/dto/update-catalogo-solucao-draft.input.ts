import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateCatalogoSolucaoDraftInput {
  @Field() @IsString() versaoId!: string;
  @Field(() => Int) @IsInt() revisaoEsperada!: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() nome?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() descricao?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() eyebrow?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() ordem?: number;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() exibirNoHub?: boolean;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() somenteAdminSistema?: boolean;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() motivo?: string;
}
