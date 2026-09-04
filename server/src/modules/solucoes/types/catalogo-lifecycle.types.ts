export const CATALOGO_VERSION_STATES = ['RASCUNHO', 'PUBLICADA', 'SUBSTITUIDA', 'DESCARTADA'] as const;
export type CatalogoVersionState = typeof CATALOGO_VERSION_STATES[number];

export const CATALOGO_PUBLICATION_STATUSES = ['RASCUNHO', 'PUBLICADA', 'DESPUBLICADA'] as const;
export type CatalogoPublicationStatus = typeof CATALOGO_PUBLICATION_STATUSES[number];

export type CatalogoValidationIssue = {
  code: string;
  field?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
};

export type ThreeWayMergeResult<T> = {
  value: T;
  conflict: boolean;
};

export type CatalogoActionSnapshot = {
  funcionalidadeId: number;
  chave: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  configuracao: string | null;
  consumerKey: string | null;
  consumerVersion: number | null;
};
