import { registerEnumType } from '@nestjs/graphql';

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
