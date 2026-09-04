import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

@InputType()
export class SalvarCapacitacaoInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsString() @MaxLength(120) nome!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(500) descricao?: string | null;
  @Field(() => Int) @IsInt() @Min(1) nivelHierarquico!: number;
  @Field() @IsBoolean() ativo!: boolean;
}

@InputType()
export class ExcluirCapacitacaoInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}

@InputType()
export class SalvarEquipeInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsString() @MaxLength(120) nome!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(500) descricao?: string | null;
  @Field() @IsBoolean() ativo!: boolean;
  @Field(() => [String]) @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) recursoIds!: string[];
  @Field(() => [String]) @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) projetoIds!: string[];
}

@InputType()
export class ExcluirEquipeInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
