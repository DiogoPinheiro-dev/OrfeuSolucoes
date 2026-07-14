import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoRelatorioItemType {
  @Field(() => String) id!: string; @Field(() => Int) numero!: number; @Field(() => String) titulo!: string;
  @Field(() => String) status!: string; @Field(() => String) slaStatus!: string;
  @Field(() => String) prioridade!: string; @Field(() => String) categoria!: string;
  @Field(() => String) solicitante!: string; @Field(() => String) atendente!: string;
  @Field(() => Date) criadoEm!: Date; @Field(() => Date, { nullable: true }) primeiraRespostaEm?: Date | null;
  @Field(() => Date, { nullable: true }) resolvidoEm?: Date | null;
  @Field(() => Float, { nullable: true }) tempoPrimeiraRespostaMinutos?: number | null;
  @Field(() => Float, { nullable: true }) tempoResolucaoMinutos?: number | null;
}
@ObjectType()
export class ChamadoRelatorioPageType {
  @Field(() => [ChamadoRelatorioItemType]) items!: ChamadoRelatorioItemType[];
  @Field(() => Int) total!: number; @Field(() => Int) page!: number; @Field(() => Int) pageSize!: number; @Field(() => Int) totalPages!: number;
}