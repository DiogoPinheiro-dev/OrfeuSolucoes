import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  ProjetoItemPrioridade,
  ProjetoItemStatus,
  ProjetoItemTipo
} from '../types/projeto-item.types';
import { ProjetoSprintStatus } from '../types/projeto-sprint.types';

@ObjectType()
export class ProjetoSprintPermissoesType {
  @Field() podeVisualizar!: boolean;
  @Field() podeCriar!: boolean;
  @Field() podeEditar!: boolean;
  @Field() podePlanejar!: boolean;
  @Field() podeIniciar!: boolean;
  @Field() podeConcluir!: boolean;
  @Field() podeCancelar!: boolean;
}

@ObjectType()
export class ProjetoSprintItemType {
  @Field() vinculoId!: string;
  @Field() itemId!: string;
  @Field() chave!: string;
  @Field() titulo!: string;
  @Field(() => ProjetoItemTipo) tipo!: ProjetoItemTipo;
  @Field(() => ProjetoItemStatus) status!: ProjetoItemStatus;
  @Field(() => ProjetoItemPrioridade) prioridade!: ProjetoItemPrioridade;
  @Field(() => Int, { nullable: true }) estimativaMinutos?: number | null;
  @Field() escopoInicial!: boolean;
  @Field() adicionadoAposInicio!: boolean;
  @Field() retiradoAposInicio!: boolean;
  @Field(() => Date) incluidoEm!: Date;
  @Field(() => Date, { nullable: true }) retiradoEm?: Date | null;
  @Field(() => ProjetoItemStatus, { nullable: true })
  statusAoIniciar?: ProjetoItemStatus | null;
  @Field(() => Int, { nullable: true }) estimativaAoIniciar?: number | null;
  @Field(() => ProjetoItemStatus, { nullable: true })
  statusAoEncerrar?: ProjetoItemStatus | null;
  @Field(() => Int, { nullable: true }) estimativaAoEncerrar?: number | null;
  @Field(() => Boolean, { nullable: true }) concluidoNoSprint?: boolean | null;
}

@ObjectType()
export class ProjetoSprintType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() nome!: string;
  @Field(() => String, { nullable: true }) objetivo?: string | null;
  @Field(() => ProjetoSprintStatus) status!: ProjetoSprintStatus;
  @Field(() => Date) inicioPrevistoEm!: Date;
  @Field(() => Date) fimPrevistoEm!: Date;
  @Field(() => Date, { nullable: true }) inicioRealEm?: Date | null;
  @Field(() => Date, { nullable: true }) fimRealEm?: Date | null;
  @Field(() => String, { nullable: true }) resultado?: string | null;
  @Field(() => Int) versao!: number;
  @Field(() => Int, { nullable: true }) escopoInicialItens?: number | null;
  @Field(() => Int, { nullable: true }) escopoInicialEstimativa?: number | null;
  @Field(() => Int, { nullable: true }) itensConcluidos?: number | null;
  @Field(() => Int, { nullable: true }) estimativaConcluida?: number | null;
  @Field(() => Int) itensAdicionadosAposInicio!: number;
  @Field(() => Int) itensRetiradosAposInicio!: number;
  @Field(() => Int) totalItens!: number;
  @Field(() => Int) totalConcluidos!: number;
  @Field(() => Int) progressoPercentual!: number;
  @Field(() => [ProjetoSprintItemType]) itens!: ProjetoSprintItemType[];
  @Field(() => Date) criadoEm!: Date;
  @Field(() => Date) atualizadoEm!: Date;
}

@ObjectType()
export class ProjetoSprintCandidatoType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() titulo!: string;
  @Field(() => ProjetoItemTipo) tipo!: ProjetoItemTipo;
  @Field(() => ProjetoItemStatus) status!: ProjetoItemStatus;
  @Field(() => ProjetoItemPrioridade) prioridade!: ProjetoItemPrioridade;
  @Field(() => Int, { nullable: true }) estimativaMinutos?: number | null;
}

@ObjectType()
export class ProjetoSprintPainelType {
  @Field(() => [ProjetoSprintType]) planejadas!: ProjetoSprintType[];
  @Field(() => ProjetoSprintType, { nullable: true })
  ativa?: ProjetoSprintType | null;
  @Field(() => [ProjetoSprintType]) historico!: ProjetoSprintType[];
  @Field(() => [ProjetoSprintCandidatoType]) candidatos!: ProjetoSprintCandidatoType[];
  @Field(() => ProjetoSprintPermissoesType)
  permissoes!: ProjetoSprintPermissoesType;
}
