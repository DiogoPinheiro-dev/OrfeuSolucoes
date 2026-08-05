import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class SalvarPlanejamentoRecursoExecucaoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() projetoRecursoId!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsUUID() tarefaId!: string;
  @Field() @IsDateString() inicioEm!: string;
  @Field() @IsDateString() fimEm!: string;
  @Field(() => Int) @IsInt() @Min(1) alocacaoMinutos!: number;
}

@InputType()
export class ExcluirPlanejamentoRecursoExecucaoInput {
  @Field() @IsUUID() projetoId!: string;
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
