export type SolucaoRecord = {
  id: number;
  slug: string;
  nome: string;
  descricao?: string | null;
  eyebrow?: string | null;
  ordem: number;
  ativo: boolean;
  exibirNoHub: boolean;
  somenteAdminSistema: boolean;
  funcionalidades?: FuncionalidadeRecord[];
};

export type FuncionalidadeRecord = {
  id: number;
  solucaoId: number;
  slug: string;
  titulo: string;
  label?: string | null;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  registryKey?: string | null;
  somenteAdminSistema: boolean;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
  acoes?: FuncionalidadeAcaoRecord[];
};

export type FuncionalidadeAcaoRecord = {
  id: number;
  funcionalidadeId: number;
  chave: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  acaoPadrao: boolean;
  configuracao?: string | null;
  permitido?: boolean;
};
