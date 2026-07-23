import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';
import {
  ProjetoItemPrioridade,
  ProjetoItemStatus,
  ProjetoItemTipo
} from '../types/projeto-item.types';

@ObjectType()
export class ProjetoItemPermissoesType {
  @Field()
  podeVisualizar!: boolean;

  @Field()
  podeCriar!: boolean;

  @Field()
  podeAlterar!: boolean;

  @Field()
  podeAlterarStatus!: boolean;

  @Field()
  podeArquivar!: boolean;

  @Field()
  podeReativar!: boolean;

  @Field()
  podePriorizar!: boolean;
}

@ObjectType()
export class ProjetoItemType {
  @Field()
  id!: string;

  @Field(() => Int)
  empresaId!: number;

  @Field()
  projetoId!: string;

  @Field(() => Int)
  numero!: number;

  @Field()
  chave!: string;

  @Field(() => Int)
  ordemBacklog!: number;

  @Field(() => ProjetoItemTipo)
  tipo!: ProjetoItemTipo;

  @Field()
  titulo!: string;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => ProjetoItemStatus)
  status!: ProjetoItemStatus;

  @Field(() => ProjetoItemPrioridade)
  prioridade!: ProjetoItemPrioridade;

  @Field(() => String, { nullable: true })
  responsavelId?: string | null;

  @Field(() => ProjetoUsuarioType, { nullable: true })
  responsavel?: ProjetoUsuarioType | null;

  @Field()
  autorId!: string;

  @Field(() => ProjetoUsuarioType)
  autor!: ProjetoUsuarioType;

  @Field(() => String, { nullable: true })
  paiId?: string | null;

  @Field(() => Date, { nullable: true })
  inicioPrevistoEm?: Date | null;

  @Field(() => Date, { nullable: true })
  fimPrevistoEm?: Date | null;

  @Field(() => Int, { nullable: true })
  estimativaMinutos?: number | null;

  @Field(() => Date, { nullable: true })
  concluidoEm?: Date | null;

  @Field(() => Int)
  versao!: number;

  @Field(() => Date, { nullable: true })
  arquivadoEm?: Date | null;

  @Field(() => ProjetoUsuarioType, { nullable: true })
  arquivadoPor?: ProjetoUsuarioType | null;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;

  @Field(() => ProjetoItemPermissoesType)
  permissoes!: ProjetoItemPermissoesType;
}

@ObjectType()
export class ProjetoItemPageType {
  @Field(() => [ProjetoItemType])
  items!: ProjetoItemType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pagina!: number;

  @Field(() => Int)
  limite!: number;

  @Field(() => Int)
  totalPaginas!: number;

  @Field(() => Int)
  backlogVersao!: number;

  @Field(() => ProjetoItemPermissoesType)
  permissoes!: ProjetoItemPermissoesType;
}
