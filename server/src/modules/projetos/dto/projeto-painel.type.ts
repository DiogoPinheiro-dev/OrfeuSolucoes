import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoItemStatus } from '../types/projeto-item.types';

@ObjectType()
export class ProjetoIndicadorOrigemType {
  @Field() tela!: string;
  @Field(() => [String]) filtros!: string[];
}

@ObjectType({ isAbstract: true })
abstract class ProjetoIndicadorBaseType {
  @Field(() => Date) calculadoEm!: Date;
  @Field(() => [String]) avisos!: string[];
  @Field(() => ProjetoIndicadorOrigemType) origem!: ProjetoIndicadorOrigemType;
}

@ObjectType()
export class ProjetoIndicadorProgressoType extends ProjetoIndicadorBaseType {
  @Field(() => Int) percentual!: number;
  @Field(() => Int, { nullable: true }) esperadoPercentual?: number | null;
  @Field() usaEstimativas!: boolean;
  @Field(() => Int) itensAbertos!: number;
  @Field(() => Int) itensEmAndamento!: number;
  @Field(() => Int) itensConcluidos!: number;
  @Field(() => Int) itensCancelados!: number;
}

@ObjectType()
export class ProjetoIndicadorPrazosType extends ProjetoIndicadorBaseType {
  @Field(() => Int, { nullable: true }) diasAteFim?: number | null;
  @Field(() => Int) itensAtrasados!: number;
  @Field(() => Int) itensSemFimPrevisto!: number;
}

@ObjectType()
export class ProjetoIndicadorSprintType extends ProjetoIndicadorBaseType {
  @Field(() => String, { nullable: true }) nome?: string | null;
  @Field(() => Int, { nullable: true }) diasRestantes?: number | null;
  @Field(() => Int) progressoPercentual!: number;
  @Field(() => Int) itensAdicionadosAposInicio!: number;
  @Field(() => Int) itensRetiradosAposInicio!: number;
}

@ObjectType()
export class ProjetoIndicadorBloqueiosType extends ProjetoIndicadorBaseType {
  @Field(() => Int) itensBloqueados!: number;
  @Field(() => Int) inconsistenciasDeDatas!: number;
}

@ObjectType()
export class ProjetoIndicadorMarcoEntregaItemType {
  @Field() id!: string;
  @Field() tipo!: string;
  @Field() nome!: string;
  @Field() status!: string;
  @Field(() => Date) dataPrevistaEm!: Date;
  @Field(() => Int) progressoPercentual!: number;
  @Field() atrasado!: boolean;
}

@ObjectType()
export class ProjetoIndicadorMarcosEntregasType extends ProjetoIndicadorBaseType {
  @Field(() => [ProjetoIndicadorMarcoEntregaItemType]) proximos!: ProjetoIndicadorMarcoEntregaItemType[];
  @Field(() => Int) atrasados!: number;
}

@ObjectType()
export class ProjetoIndicadorOrcamentoType extends ProjetoIndicadorBaseType {
  @Field(() => String, { nullable: true }) moeda?: string | null;
  @Field(() => String, { nullable: true }) totalPlanejado?: string | null;
  @Field(() => String, { nullable: true }) totalRealizadoConsolidado?: string | null;
  @Field(() => String, { nullable: true }) variacaoConsolidada?: string | null;
  @Field(() => Float, { nullable: true }) percentualConsumido?: number | null;
  @Field() status!: string;
  @Field(() => Int) apontamentosSemCusto!: number;
}

@ObjectType()
export class ProjetoIndicadorEsforcoType extends ProjetoIndicadorBaseType {
  @Field(() => Int) estimativaTotalMinutos!: number;
  @Field(() => Int) minutosAprovados!: number;
  @Field(() => Int) minutosEnviadosPendentes!: number;
}

@ObjectType()
export class ProjetoIndicadorAtividadeType extends ProjetoIndicadorBaseType {
  @Field(() => Date, { nullable: true }) ultimaAtualizacaoEm?: Date | null;
  @Field(() => String, { nullable: true }) ultimaAtualizacaoAutor?: string | null;
  @Field(() => String, { nullable: true }) saudePercebida?: string | null;
  @Field(() => Int) eventosNosUltimosSeteDias!: number;
  @Field(() => Date, { nullable: true }) ultimoEventoEm?: Date | null;
}

@ObjectType()
export class ProjetoPainelType {
  @Field() projetoId!: string;
  @Field(() => ProjetoIndicadorProgressoType) progresso!: ProjetoIndicadorProgressoType;
  @Field(() => ProjetoIndicadorPrazosType) prazos!: ProjetoIndicadorPrazosType;
  @Field(() => ProjetoIndicadorSprintType) sprintAtiva!: ProjetoIndicadorSprintType;
  @Field(() => ProjetoIndicadorBloqueiosType) bloqueios!: ProjetoIndicadorBloqueiosType;
  @Field(() => ProjetoIndicadorMarcosEntregasType) marcosEntregas!: ProjetoIndicadorMarcosEntregasType;
  @Field(() => ProjetoIndicadorOrcamentoType, { nullable: true }) orcamento?: ProjetoIndicadorOrcamentoType | null;
  @Field(() => ProjetoIndicadorEsforcoType) esforco!: ProjetoIndicadorEsforcoType;
  @Field(() => ProjetoIndicadorAtividadeType) atividade!: ProjetoIndicadorAtividadeType;
}

export type ProjetoPainelItemRecord = {
  id: string;
  status: ProjetoItemStatus | string;
  estimativaMinutos?: number | null;
  inicioPrevistoEm?: Date | null;
  fimPrevistoEm?: Date | null;
  arquivadoEm?: Date | null;
};
