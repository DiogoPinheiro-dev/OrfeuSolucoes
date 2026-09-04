import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateCatalogoAcaoDraftInput {
  @Field() @IsString() versaoId!: string;
  @Field(() => Int) @IsInt() revisaoEsperada!: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() nome?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() descricao?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() ordem?: number;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() configuracao?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() consumerKey?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() consumerVersion?: number | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() motivo?: string;
}
