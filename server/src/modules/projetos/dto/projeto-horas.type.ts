import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoApontamentoCustoSituacao, ProjetoApontamentoPeriodoSituacao } from '../types/projeto-apontamento.types';
import { ProjetoApontamentoBaseType, ProjetoApontamentoItemType } from './projeto-apontamento.type';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoHorasAcoesType {
  @Field() podeAprovar!: boolean;
  @Field() podeRejeitar!: boolean;
  @Field() podeReabrir!: boolean;
  @Field(() => String, {
    nullable: true,
    description: 'Por que nenhuma das decisões que a pessoa teria para este apontamento pode ser tomada.'
  })
  bloqueio?: string | null;
}

@ObjectType({ description: 'Custo congelado na aprovação do apontamento.' })
export class ProjetoApontamentoCustoType {
  @Field(() => ProjetoApontamentoCustoSituacao) situacao!: ProjetoApontamentoCustoSituacao;
  @Field(() => String, { nullable: true, description: 'Linha de custo do orçamento usada no cálculo.' }) custoId?: string | null;
  @Field(() => String, { nullable: true }) taxaHoraAplicada?: string | null;
  @Field(() => String, { nullable: true }) valorCusto?: string | null;
  @Field(() => String, { nullable: true }) moeda?: string | null;
}

@ObjectType()
export class ProjetoHorasApontamentoType extends ProjetoApontamentoBaseType {
  @Field(() => ProjetoUsuarioType, { description: 'Autor do apontamento.' }) usuario!: ProjetoUsuarioType;
  @Field(() => ProjetoHorasAcoesType) acoes!: ProjetoHorasAcoesType;
  @Field(() => ProjetoApontamentoCustoType, {
    nullable: true,
    description: 'Nulo para quem não tem visualizar_financeiro no Orçamento do projeto.'
  })
  custo?: ProjetoApontamentoCustoType | null;
}

@ObjectType()
export class ProjetoHorasTotalUsuarioType {
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
  @Field(() => Int) minutos!: number;
}

@ObjectType()
export class ProjetoHorasTotalItemType {
  @Field(() => ProjetoApontamentoItemType, { nullable: true, description: 'Nulo reúne os apontamentos sem item.' })
  item?: ProjetoApontamentoItemType | null;
  @Field(() => Int) minutos!: number;
}

@ObjectType()
export class ProjetoApontamentoCompetenciaType {
  @Field({ description: 'Mês de referência, no formato YYYY-MM.' }) competencia!: string;
  @Field({ description: 'Competência sem registro está aberta.' }) fechada!: boolean;
  @Field(() => ProjetoApontamentoPeriodoSituacao, { nullable: true }) situacao?: ProjetoApontamentoPeriodoSituacao | null;
  @Field(() => Int, { nullable: true, description: 'Versão do registro da competência, exigida para reabri-la.' }) versao?: number | null;
  @Field(() => Date, { nullable: true }) fechadoEm?: Date | null;
  @Field(() => ProjetoUsuarioType, { nullable: true }) fechadoPor?: ProjetoUsuarioType | null;
  @Field(() => Date, { nullable: true }) reabertoEm?: Date | null;
  @Field(() => ProjetoUsuarioType, { nullable: true }) reabertoPor?: ProjetoUsuarioType | null;
  @Field(() => String, { nullable: true }) motivoReabertura?: string | null;
  @Field(() => Int, { description: 'Minutos lançados no mês, no escopo de quem consulta.' }) minutos!: number;
  @Field(() => Int, { description: 'Apontamentos enviados aguardando decisão no mês, no escopo de quem consulta.' })
  enviadosPendentes!: number;
  @Field() podeFechar!: boolean;
  @Field() podeReabrir!: boolean;
  @Field(() => String, { nullable: true, description: 'Por que a competência ainda não pode ser fechada.' })
  bloqueio?: string | null;
}

@ObjectType()
export class ProjetoHorasPermissoesType {
  @Field() podeAprovar!: boolean;
  @Field() podeReabrir!: boolean;
  @Field() podeFecharPeriodo!: boolean;
  @Field() podeVisualizarFinanceiro!: boolean;
  @Field() podeGerenciarFinanceiro!: boolean;
}

@ObjectType()
export class ProjetoHorasCustoUsuarioType {
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
  @Field(() => Int, { description: 'Minutos aprovados com custo calculado.' }) minutos!: number;
  @Field() valor!: string;
}

@ObjectType()
export class ProjetoHorasCustoItemType {
  @Field(() => ProjetoApontamentoItemType, { nullable: true, description: 'Nulo reúne os apontamentos sem item.' })
  item?: ProjetoApontamentoItemType | null;
  @Field(() => Int, { description: 'Minutos aprovados com custo calculado.' }) minutos!: number;
  @Field() valor!: string;
}

@ObjectType({ description: 'Linha de custo de recurso do orçamento, com o realizado pelas horas aprovadas ligadas a ela.' })
export class ProjetoHorasLinhaCustoType {
  @Field() custoId!: string;
  @Field() descricao!: string;
  @Field(() => ProjetoUsuarioType, { nullable: true, description: 'Pessoa do recurso da linha.' }) usuario?: ProjetoUsuarioType | null;
  @Field(() => ProjetoApontamentoItemType, { nullable: true }) item?: ProjetoApontamentoItemType | null;
  @Field(() => Int, { nullable: true, description: 'Minutos planejados na linha.' }) quantidadeMinutos?: number | null;
  @Field(() => String, { nullable: true }) taxaHora?: string | null;
  @Field() valorPlanejado!: string;
  @Field(() => Int) minutosAprovados!: number;
  @Field() valorRealizadoHoras!: string;
}

@ObjectType()
export class ProjetoHorasFinanceiroType {
  @Field(() => String, { nullable: true, description: 'Moeda do orçamento do projeto.' }) moeda?: string | null;
  @Field({ description: 'Custo das horas aprovadas no período e nos filtros consultados.' }) totalCusto!: string;
  @Field(() => [ProjetoHorasCustoUsuarioType]) custosPorUsuario!: ProjetoHorasCustoUsuarioType[];
  @Field(() => [ProjetoHorasCustoItemType]) custosPorItem!: ProjetoHorasCustoItemType[];
  @Field(() => [ProjetoHorasLinhaCustoType]) linhas!: ProjetoHorasLinhaCustoType[];
  @Field(() => Int, { description: 'Apontamentos aprovados do projeto sem custo, por falta de taxa ou por taxa ambígua.' })
  apontamentosSemCusto!: number;
}

@ObjectType()
export class ProjetoHorasPageType {
  @Field(() => [ProjetoHorasApontamentoType]) items!: ProjetoHorasApontamentoType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) pagina!: number;
  @Field(() => Int) limite!: number;
  @Field(() => Int) totalPaginas!: number;
  @Field(() => Int, { description: 'Minutos no período, nos filtros e no escopo de quem consulta.' }) totalMinutos!: number;
  @Field(() => [ProjetoHorasTotalUsuarioType]) totaisPorUsuario!: ProjetoHorasTotalUsuarioType[];
  @Field(() => [ProjetoHorasTotalItemType]) totaisPorItem!: ProjetoHorasTotalItemType[];
  @Field(() => [ProjetoApontamentoCompetenciaType], { description: 'Competências alcançadas pelo período.' })
  competencias!: ProjetoApontamentoCompetenciaType[];
  @Field(() => ProjetoHorasPermissoesType) permissoes!: ProjetoHorasPermissoesType;
  @Field(() => ProjetoHorasFinanceiroType, {
    nullable: true,
    description: 'Nulo para quem não tem visualizar_financeiro no Orçamento do projeto.'
  })
  financeiro?: ProjetoHorasFinanceiroType | null;
}

@ObjectType()
export class ProjetoApontamentoRecalculoType {
  @Field(() => Int, { description: 'Apontamentos que passaram a ter custo calculado.' }) calculados!: number;
  @Field(() => Int, { description: 'Apontamentos aprovados que continuam sem custo calculado.' }) pendentes!: number;
}
