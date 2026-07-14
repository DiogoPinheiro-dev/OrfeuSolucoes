import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoDashboardSerieType {
  @Field(() => String) chave!: string;
  @Field(() => String) nome!: string;
  @Field(() => Int) total!: number;
  @Field(() => String, { nullable: true }) cor?: string | null;
}

@ObjectType()
export class ChamadoDashboardType {
  @Field(() => Int) totalAbertos!: number;
  @Field(() => Int) emAtendimento!: number;
  @Field(() => Int) pendentes!: number;
  @Field(() => Int) resolvidos!: number;
  @Field(() => Int) arquivados!: number;
  @Field(() => Int) atrasados!: number;
  @Field(() => Float, { nullable: true }) tempoMedioPrimeiraRespostaMinutos?: number | null;
  @Field(() => Float, { nullable: true }) tempoMedioResolucaoMinutos?: number | null;
  @Field(() => [ChamadoDashboardSerieType]) porPrioridade!: ChamadoDashboardSerieType[];
  @Field(() => [ChamadoDashboardSerieType]) porCategoria!: ChamadoDashboardSerieType[];
  @Field(() => [ChamadoDashboardSerieType]) porAtendente!: ChamadoDashboardSerieType[];
}