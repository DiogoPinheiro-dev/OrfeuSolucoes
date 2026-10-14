import { registerEnumType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { ProjetoUsuarioRecord } from './projeto.types';

export enum ProjetoApontamentoStatus {
  RASCUNHO = 'RASCUNHO',
  ENVIADO = 'ENVIADO',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO'
}

export enum ProjetoApontamentoCustoSituacao {
  NAO_APLICAVEL = 'NAO_APLICAVEL',
  CALCULADO = 'CALCULADO',
  SEM_TAXA = 'SEM_TAXA',
  TAXA_AMBIGUA = 'TAXA_AMBIGUA'
}

export enum ProjetoApontamentoPeriodoSituacao {
  FECHADO = 'FECHADO',
  REABERTO = 'REABERTO'
}

export enum ProjetoApontamentoOperacao {
  SALVAR = 'SALVAR',
  EXCLUIR = 'EXCLUIR',
  DESCARTAR = 'DESCARTAR',
  ENVIAR = 'ENVIAR',
  RECOLHER = 'RECOLHER',
  APROVAR = 'APROVAR',
  REJEITAR = 'REJEITAR',
  REABRIR = 'REABRIR'
}

registerEnumType(ProjetoApontamentoStatus, { name: 'ProjetoApontamentoStatus' });
registerEnumType(ProjetoApontamentoCustoSituacao, { name: 'ProjetoApontamentoCustoSituacao' });
registerEnumType(ProjetoApontamentoPeriodoSituacao, { name: 'ProjetoApontamentoPeriodoSituacao' });

export type ProjetoApontamentoRecord = {
  id: string;
  empresaId: number;
  projetoId: string;
  usuarioId: string;
  itemId?: string | null;
  dataTrabalho: Date;
  minutos: number;
  descricao: string;
  faturavel: boolean;
  status: string;
  enviadoEm?: Date | null;
  decididoPorId?: string | null;
  decididoEm?: Date | null;
  motivo?: string | null;
  custoId?: string | null;
  taxaHistoricoId?: string | null;
  taxaHoraAplicada?: Prisma.Decimal.Value | null;
  valorCusto?: Prisma.Decimal.Value | null;
  moeda?: string | null;
  custoSituacao?: string;
  arquivadoEm?: Date | null;
  arquivadoPorId?: string | null;
  versao: number;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ProjetoApontamentoDetalheRecord = ProjetoApontamentoRecord & {
  projeto: {
    id: string;
    chave: string;
    nome: string;
    situacao: string;
    arquivadoEm?: Date | null;
    responsavelId: string;
    membros: Array<{ papel: string }>;
  };
  item?: { id: string; chave: string; titulo: string } | null;
  decididoPor?: ProjetoUsuarioRecord | null;
};

/** Apontamento com o autor, na visão de gestão de Horas do projeto. */
export type ProjetoHorasApontamentoRecord = ProjetoApontamentoRecord & {
  usuario: ProjetoUsuarioRecord;
  item?: { id: string; chave: string; titulo: string } | null;
  decididoPor?: ProjetoUsuarioRecord | null;
};

/** Custo congelado no apontamento aprovado, ou a situação que impediu o cálculo. */
export type ProjetoApontamentoCusto = {
  custoSituacao: ProjetoApontamentoCustoSituacao;
  custoId: string | null;
  taxaHistoricoId: string | null;
  taxaHoraAplicada: string | null;
  valorCusto: string | null;
  moeda: string | null;
};

/** O que um apontamento fora da aprovação guarda de custo: nada calculado. */
export const PROJETO_APONTAMENTO_SEM_CUSTO: ProjetoApontamentoCusto = {
  custoSituacao: ProjetoApontamentoCustoSituacao.NAO_APLICAVEL,
  custoId: null,
  taxaHistoricoId: null,
  taxaHoraAplicada: null,
  valorCusto: null,
  moeda: null
};
