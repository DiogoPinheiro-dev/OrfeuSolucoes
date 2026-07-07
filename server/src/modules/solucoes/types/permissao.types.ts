export type FuncionalidadePermissao = {
  funcionalidadeId: number;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
  acoes?: FuncionalidadeAcaoPermissao[];
};

export type FuncionalidadeAcaoPermissao = {
  funcionalidadeId: number;
  acaoId: number;
  chave?: string | null;
  permitido?: boolean;
};

export type GrupoAccessDefaults = {
  podeVisualizar?: boolean | null;
  podeIncluir?: boolean | null;
  podeAlterar?: boolean | null;
  podeExcluir?: boolean | null;
};
