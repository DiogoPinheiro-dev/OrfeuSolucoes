import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoItemStatus } from '../types/projeto-item.types';
import {
  ProjetoEntregaStatus,
  ProjetoMarcoStatus
} from '../types/projeto-marco-entrega.types';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoCompromissoItemType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() titulo!: string;
  @Field(() => ProjetoItemStatus) status!: ProjetoItemStatus;
  @Field(() => Int, { nullable: true }) estimativaMinutos?: number | null;
}

@ObjectType()
export class ProjetoMarcoType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() nome!: string;
  @Field(() => String, { nullable: true }) descricao?: string | null;
  @Field(() => ProjetoMarcoStatus) status!: ProjetoMarcoStatus;
  @Field(() => Date) dataPrevistaEm!: Date;
  @Field(() => Date, { nullable: true }) dataRealizadaEm?: Date | null;
  @Field(() => ProjetoUsuarioType) responsavel!: ProjetoUsuarioType;
  @Field(() => Int) versao!: number;
  @Field() atrasado!: boolean;
  @Field(() => Int) progressoPercentual!: number;
  @Field(() => Int) itensSemEstimativa!: number;
  @Field(() => [ProjetoCompromissoItemType]) itens!: ProjetoCompromissoItemType[];
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => Date) atualizadoEm!: Date;
}

@ObjectType()
export class ProjetoEntregaType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() nome!: string;
  @Field() resultadoEsperado!: string;
  @Field() criteriosAceite!: string;
  @Field(() => ProjetoEntregaStatus) status!: ProjetoEntregaStatus;
  @Field(() => Date) inicioPrevistoEm!: Date;
  @Field(() => Date) fimPrevistoEm!: Date;
  @Field(() => Date, { nullable: true }) concluidaEm?: Date | null;
  @Field(() => String, { nullable: true }) marcoId?: string | null;
  @Field(() => String, { nullable: true }) marcoNome?: string | null;
  @Field(() => ProjetoUsuarioType) responsavel!: ProjetoUsuarioType;
  @Field(() => Int) versao!: number;
  @Field() atrasada!: boolean;
  @Field(() => Int) progressoPercentual!: number;
  @Field(() => Int) itensSemEstimativa!: number;
  @Field(() => [ProjetoCompromissoItemType]) itens!: ProjetoCompromissoItemType[];
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => Date) atualizadoEm!: Date;
}

@ObjectType()
export class ProjetoMarcoEntregaPermissoesType {
  @Field() podeVisualizar!: boolean;
  @Field() podeCriar!: boolean;
  @Field() podeEditar!: boolean;
  @Field() podeArquivar!: boolean;
  @Field() podeReativar!: boolean;
}

@ObjectType()
export class ProjetoMarcoEntregaPainelType {
  @Field(() => [ProjetoMarcoType]) marcos!: ProjetoMarcoType[];
  @Field(() => [ProjetoEntregaType]) entregas!: ProjetoEntregaType[];
  @Field(() => [ProjetoCompromissoItemType]) itensDisponiveis!: ProjetoCompromissoItemType[];
  @Field(() => [ProjetoUsuarioType]) responsaveis!: ProjetoUsuarioType[];
  @Field(() => ProjetoMarcoEntregaPermissoesType) permissoes!: ProjetoMarcoEntregaPermissoesType;
}
