import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  ProjetoCronogramaElementoTipo,
  ProjetoCronogramaSeveridade
} from '../types/projeto-cronograma.types';

@ObjectType()
export class ProjetoCronogramaItemReferenciaType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() titulo!: string;
  @Field() status!: string;
  @Field(() => Date, { nullable: true }) inicioPrevistoEm?: Date | null;
  @Field(() => Date, { nullable: true }) fimPrevistoEm?: Date | null;
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
}

@ObjectType()
export class ProjetoItemDependenciaType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field(() => ProjetoCronogramaItemReferenciaType)
  bloqueador!: ProjetoCronogramaItemReferenciaType;
  @Field(() => ProjetoCronogramaItemReferenciaType)
  bloqueado!: ProjetoCronogramaItemReferenciaType;
  @Field(() => Int) versao!: number;
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => Date) atualizadoEm!: Date;
}

@ObjectType()
export class ProjetoCronogramaElementoType {
  @Field() id!: string;
  @Field(() => ProjetoCronogramaElementoTipo)
  tipo!: ProjetoCronogramaElementoTipo;
  @Field() titulo!: string;
  @Field(() => String, { nullable: true }) chave?: string | null;
  @Field() status!: string;
  @Field() grupo!: string;
  @Field(() => Date, { nullable: true }) inicioEm?: Date | null;
  @Field(() => Date, { nullable: true }) fimEm?: Date | null;
  @Field(() => Int, { nullable: true }) versao?: number | null;
  @Field(() => Int) progressoPercentual!: number;
  @Field() semPeriodo!: boolean;
  @Field() bloqueado!: boolean;
  @Field() riscoAtraso!: boolean;
  @Field() arquivado!: boolean;
  @Field(() => [String]) itemIds!: string[];
}

@ObjectType()
export class ProjetoCronogramaInconsistenciaType {
  @Field() codigo!: string;
  @Field(() => ProjetoCronogramaSeveridade)
  severidade!: ProjetoCronogramaSeveridade;
  @Field() mensagem!: string;
  @Field(() => [String]) elementoIds!: string[];
}

@ObjectType()
export class ProjetoCronogramaPermissoesType {
  @Field() podeVisualizar!: boolean;
  @Field() podeGerenciarDependencias!: boolean;
  @Field() podeEditarDatas!: boolean;
}

@ObjectType()
export class ProjetoCronogramaPainelType {
  @Field(() => [ProjetoCronogramaElementoType])
  elementos!: ProjetoCronogramaElementoType[];
  @Field(() => [ProjetoItemDependenciaType])
  dependencias!: ProjetoItemDependenciaType[];
  @Field(() => [ProjetoCronogramaInconsistenciaType])
  inconsistencias!: ProjetoCronogramaInconsistenciaType[];
  @Field(() => Date, { nullable: true }) inicioEm?: Date | null;
  @Field(() => Date, { nullable: true }) fimEm?: Date | null;
  @Field(() => ProjetoCronogramaPermissoesType)
  permissoes!: ProjetoCronogramaPermissoesType;
}
