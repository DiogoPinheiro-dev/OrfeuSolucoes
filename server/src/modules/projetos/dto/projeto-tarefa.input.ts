import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

const MONEY = /^\d{1,16}(\.\d{1,4})?$/;

@InputType()
export class SalvarProjetoTarefaInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsUUID() recursoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() projetoRecursoId?: string | null;
  @Field() @IsString() @MaxLength(500) funcionalidade!: string;
  @Field(() => Int) @IsInt() @Min(1) estimativaMinutos!: number;
  @Field() @Matches(MONEY) valorHora!: string;
  @Field() @IsString() @Matches(/^[A-Z]{3}$/) moeda!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(500) observacao?: string | null;
  @Field() @IsBoolean() ativo!: boolean;
}

@InputType()
export class ExcluirProjetoTarefaInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
