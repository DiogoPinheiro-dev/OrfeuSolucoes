import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';
import { ProjetoSituacao } from '../types/projeto.types';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoApontamentoProjetoType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() nome!: string;
  @Field(() => ProjetoSituacao) situacao!: ProjetoSituacao;
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
}

@ObjectType()
export class ProjetoApontamentoItemType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() titulo!: string;
}

@ObjectType()
export class ProjetoApontamentoAcoesType {
  @Field() podeAlterar!: boolean;
  @Field() podeExcluir!: boolean;
  @Field() podeDescartar!: boolean;
  @Field() podeEnviar!: boolean;
  @Field() podeRecolher!: boolean;
  @Field(() => String, {
    nullable: true,
    description: 'Por que o apontamento está somente para consulta, quando a causa não é a própria situação dele.'
  })
  bloqueio?: string | null;
}

@ObjectType()
export class ProjetoApontamentoType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field(() => ProjetoApontamentoProjetoType) projeto!: ProjetoApontamentoProjetoType;
  @Field() usuarioId!: string;
  @Field(() => String, { nullable: true }) itemId?: string | null;
  @Field(() => ProjetoApontamentoItemType, { nullable: true }) item?: ProjetoApontamentoItemType | null;
  @Field({ description: 'Dia do trabalho, no formato YYYY-MM-DD.' }) dataTrabalho!: string;
  @Field({ description: 'Mês de referência do apontamento, no formato YYYY-MM.' }) competencia!: string;
  @Field(() => Int) minutos!: number;
  @Field() descricao!: string;
  @Field() faturavel!: boolean;
  @Field(() => ProjetoApontamentoStatus) status!: ProjetoApontamentoStatus;
  @Field(() => Date, { nullable: true }) enviadoEm?: Date | null;
  @Field(() => Date, { nullable: true }) decididoEm?: Date | null;
  @Field(() => ProjetoUsuarioType, { nullable: true }) decididoPor?: ProjetoUsuarioType | null;
  @Field(() => String, { nullable: true, description: 'Último motivo de rejeição ou reabertura.' }) motivo?: string | null;
  @Field(() => Int) versao!: number;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => Date) atualizadoEm!: Date;
  @Field(() => ProjetoApontamentoAcoesType) acoes!: ProjetoApontamentoAcoesType;
}

@ObjectType()
export class ProjetoApontamentoTotalDiaType {
  @Field({ description: 'Dia, no formato YYYY-MM-DD.' }) data!: string;
  @Field(() => Int) minutos!: number;
}

@ObjectType()
export class ProjetoApontamentoTotalProjetoType {
  @Field() projetoId!: string;
  @Field() chave!: string;
  @Field() nome!: string;
  @Field(() => Int) minutos!: number;
}

@ObjectType()
export class ProjetoApontamentoPermissoesType {
  @Field() podeIncluir!: boolean;
}

@ObjectType()
export class MeusProjetoApontamentosPageType {
  @Field(() => [ProjetoApontamentoType]) items!: ProjetoApontamentoType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) pagina!: number;
  @Field(() => Int) limite!: number;
  @Field(() => Int) totalPaginas!: number;
  @Field(() => Int, { description: 'Minutos lançados no período, em todos os projetos e situações.' }) totalMinutos!: number;
  @Field(() => [ProjetoApontamentoTotalDiaType], {
    description: 'Minutos por dia no período, em todos os projetos, para acompanhar o limite de 24 horas.'
  })
  totaisPorDia!: ProjetoApontamentoTotalDiaType[];
  @Field(() => [ProjetoApontamentoTotalProjetoType], { description: 'Minutos por projeto no período.' })
  totaisPorProjeto!: ProjetoApontamentoTotalProjetoType[];
  @Field(() => ProjetoApontamentoPermissoesType) permissoes!: ProjetoApontamentoPermissoesType;
}
