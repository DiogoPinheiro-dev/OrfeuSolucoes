import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoUsuarioType } from './projeto.type';
import { ProjetoCustoTipo, ProjetoOrcamentoStatus } from '../types/projeto-orcamento.types';

@ObjectType()
export class ProjetoOrcamentoProjetoType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() nome!: string;
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
}

@ObjectType()
export class ProjetoRecursoResumoType {
  @Field() id!: string;
  @Field() cadastroRecursoId!: string;
  @Field() usuarioId!: string;
  @Field() ativo!: boolean;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoUsuarioType) usuario!: ProjetoUsuarioType;
}

@ObjectType()
export class ProjetoCustoTarefaResumoType {
  @Field() id!: string;
  @Field(() => [String]) recursoIds!: string[];
  @Field() funcionalidade!: string;
  @Field(() => Int) estimativaMinutos!: number;
  @Field() valorHora!: string;
  @Field() moeda!: string;
  @Field() ativo!: boolean;
}

@ObjectType()
export class ProjetoOrcamentoCategoriaType {
  @Field() id!: string;
  @Field() nome!: string;
  @Field() valorPlanejado!: string;
  @Field() valorComprometido!: string;
  @Field() valorRealizado!: string;
  @Field() variacao!: string;
  @Field(() => Int) versao!: number;
}

@ObjectType()
export class ProjetoCustoTaxaHistoricoType {
  @Field() id!: string;
  @Field() taxaHora!: string;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => ProjetoUsuarioType) criadoPor!: ProjetoUsuarioType;
}

@ObjectType()
export class ProjetoCustoType {
  @Field() id!: string;
  @Field(() => String, { nullable: true }) categoriaId?: string | null;
  @Field(() => ProjetoCustoTipo) tipo!: ProjetoCustoTipo;
  @Field() descricao!: string;
  @Field(() => String, { nullable: true }) recursoId?: string | null;
  @Field(() => String, { nullable: true }) tarefaId?: string | null;
  @Field(() => Int, { nullable: true }) quantidadeMinutos?: number | null;
  @Field(() => String, { nullable: true }) taxaHora?: string | null;
  @Field() valorPlanejado!: string;
  @Field() valorComprometido!: string;
  @Field() valorRealizado!: string;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoRecursoResumoType, { nullable: true }) recurso?: ProjetoRecursoResumoType | null;
  @Field(() => ProjetoCustoTarefaResumoType, { nullable: true }) tarefa?: ProjetoCustoTarefaResumoType | null;
  @Field(() => [ProjetoCustoTaxaHistoricoType]) taxas!: ProjetoCustoTaxaHistoricoType[];
}

@ObjectType()
export class ProjetoFinanceiroType {
  @Field() id!: string;
  @Field() moeda!: string;
  @Field(() => ProjetoOrcamentoStatus) status!: ProjetoOrcamentoStatus;
  @Field(() => Int) versao!: number;
  @Field() totalPlanejado!: string;
  @Field() totalComprometido!: string;
  @Field() totalRealizado!: string;
  @Field() variacao!: string;
  @Field(() => Date, { nullable: true }) aprovadoEm?: Date | null;
  @Field(() => [ProjetoOrcamentoCategoriaType]) categorias!: ProjetoOrcamentoCategoriaType[];
  @Field(() => [ProjetoCustoType]) custos!: ProjetoCustoType[];
}

@ObjectType()
export class ProjetoOrcamentoPermissoesType {
  @Field() podeVisualizarFinanceiro!: boolean;
  @Field() podeGerenciarFinanceiro!: boolean;
  @Field() podeAprovarOrcamento!: boolean;
}

@ObjectType()
export class ProjetoOrcamentoPainelType {
  @Field(() => [ProjetoRecursoResumoType]) recursos!: ProjetoRecursoResumoType[];
  @Field(() => [ProjetoCustoTarefaResumoType]) tarefas!: ProjetoCustoTarefaResumoType[];
  @Field(() => ProjetoFinanceiroType, { nullable: true }) financeiro?: ProjetoFinanceiroType | null;
  @Field(() => ProjetoOrcamentoPermissoesType) permissoes!: ProjetoOrcamentoPermissoesType;
}
