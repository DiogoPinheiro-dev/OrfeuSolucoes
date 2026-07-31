import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoSaude } from '../types/projeto.types';
import { ProjetoUsuarioType } from './projeto.type';

@ObjectType()
export class ProjetoAnexoType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() nomeOriginal!: string;
  @Field() mimeType!: string;
  @Field(() => Int) tamanho!: number;
  @Field() downloadUrl!: string;
  @Field(() => ProjetoUsuarioType) autor!: ProjetoUsuarioType;
  @Field(() => Date) criadoEm!: Date;
}

@ObjectType()
export class ProjetoAtualizacaoHistoricoType {
  @Field() id!: string;
  @Field() conteudoAnterior!: string;
  @Field(() => ProjetoSaude, { nullable: true }) saudePercebidaAnterior?: ProjetoSaude | null;
  @Field(() => Int) versaoAnterior!: number;
  @Field(() => ProjetoUsuarioType) editor!: ProjetoUsuarioType;
  @Field(() => Date) criadoEm!: Date;
}

@ObjectType()
export class ProjetoAtualizacaoType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() conteudo!: string;
  @Field(() => ProjetoSaude, { nullable: true }) saudePercebida?: ProjetoSaude | null;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoUsuarioType) autor!: ProjetoUsuarioType;
  @Field(() => [ProjetoAtualizacaoHistoricoType]) historico!: ProjetoAtualizacaoHistoricoType[];
  @Field(() => [ProjetoAnexoType]) anexos!: ProjetoAnexoType[];
  @Field() podeEditar!: boolean;
  @Field(() => Date) criadoEm!: Date;
  @Field(() => Date) atualizadoEm!: Date;
}

@ObjectType()
export class ProjetoComentarioType {
  @Field() id!: string;
  @Field() projetoId!: string;
  @Field() conteudo!: string;
  @Field(() => String, { nullable: true }) atualizacaoId?: string | null;
  @Field(() => String, { nullable: true }) itemId?: string | null;
  @Field(() => String, { nullable: true }) itemChave?: string | null;
  @Field(() => String, { nullable: true }) contexto?: string | null;
  @Field(() => Int) versao!: number;
  @Field(() => ProjetoUsuarioType) autor!: ProjetoUsuarioType;
  @Field(() => [ProjetoAnexoType]) anexos!: ProjetoAnexoType[];
  @Field() podeEditar!: boolean;
  @Field() podeExcluir!: boolean;
  @Field(() => Date, { nullable: true }) editadoEm?: Date | null;
  @Field(() => Date) criadoEm!: Date;
}

@ObjectType()
export class ProjetoFeedAlteracaoType {
  @Field() campo!: string;
  @Field(() => String, { nullable: true }) valorAnterior?: string | null;
  @Field(() => String, { nullable: true }) valorNovo?: string | null;
}

@ObjectType()
export class ProjetoFeedItemType {
  @Field() id!: string;
  @Field() tipo!: string;
  @Field() entidadeId!: string;
  @Field() registro!: string;
  @Field() evento!: string;
  @Field() entidade!: string;
  @Field() funcionalidade!: string;
  @Field(() => ProjetoUsuarioType, { nullable: true }) autorAcao?: ProjetoUsuarioType | null;
  @Field(() => [ProjetoFeedAlteracaoType]) alteracoes!: ProjetoFeedAlteracaoType[];
  @Field() conteudo!: string;
  @Field(() => ProjetoUsuarioType, { nullable: true }) autor?: ProjetoUsuarioType | null;
  @Field(() => ProjetoSaude, { nullable: true }) saudePercebida?: ProjetoSaude | null;
  @Field(() => String, { nullable: true }) contexto?: string | null;
  @Field() editado!: boolean;
  @Field(() => [ProjetoAnexoType]) anexos!: ProjetoAnexoType[];
  @Field(() => Date) criadoEm!: Date;
}

@ObjectType()
export class ProjetoComunicacaoPermissoesType {
  @Field() podePublicarAtualizacao!: boolean;
  @Field() podeEditarAtualizacao!: boolean;
  @Field() podeComentar!: boolean;
  @Field() podeModerar!: boolean;
  @Field() podeGerenciarAnexos!: boolean;
}

@ObjectType()
export class ProjetoComunicacaoProjetoType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() nome!: string;
  @Field(() => Date, { nullable: true }) arquivadoEm?: Date | null;
}

@ObjectType()
export class ProjetoComunicacaoItemType {
  @Field() id!: string;
  @Field() chave!: string;
  @Field() titulo!: string;
}
@ObjectType()
export class ProjetoComunicacaoPainelType {
  @Field(() => [ProjetoAtualizacaoType]) atualizacoes!: ProjetoAtualizacaoType[];
  @Field(() => [ProjetoComentarioType]) comentarios!: ProjetoComentarioType[];
  @Field(() => [ProjetoFeedItemType]) feed!: ProjetoFeedItemType[];
  @Field(() => Int) feedTotal!: number;
  @Field(() => Int) feedPagina!: number;
  @Field(() => Int) feedLimite!: number;
  @Field(() => Int) feedTotalPaginas!: number;
  @Field(() => [ProjetoComunicacaoItemType]) itensDisponiveis!: ProjetoComunicacaoItemType[];
  @Field(() => ProjetoComunicacaoPermissoesType) permissoes!: ProjetoComunicacaoPermissoesType;
  @Field(() => Date, { nullable: true }) ultimaAtualizacaoEm?: Date | null;
}