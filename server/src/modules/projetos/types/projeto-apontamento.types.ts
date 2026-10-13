import { registerEnumType } from '@nestjs/graphql';
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
