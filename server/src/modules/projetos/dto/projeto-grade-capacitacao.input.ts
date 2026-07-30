import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

@InputType()
export class SalvarGradeVinculoInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsUUID() cadastroRecursoId!: string;
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsBoolean() ativo!: boolean;
}

@InputType()
export class SalvarGradeCapacidadeInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() projetoRecursoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsDateString() inicioEm!: string;
  @Field() @IsDateString() fimEm!: string;
  @Field(() => Int) @IsInt() @Min(1) capacidadeMinutos!: number;
}

@InputType()
export class SalvarGradeAlocacaoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() projetoRecursoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() tarefaId?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MinLength(3) @MaxLength(500) atividade?: string | null;
  @Field() @IsDateString() inicioEm!: string;
  @Field() @IsDateString() fimEm!: string;
  @Field(() => Int) @IsInt() @Min(1) alocacaoMinutos!: number;
}

@InputType()
export class ExcluirGradeItemInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
