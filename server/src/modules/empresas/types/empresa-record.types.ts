export type EmpresaRecord = {
  id: number;
  nome?: string | null;
  acessoEcommerce?: boolean;
  acessoProjetos?: boolean;
  acessoHoras?: boolean;
  padraoSistema?: boolean;
};

export type EmpresaSolutionSummary = {
  id: number;
  slug: string;
  nome: string;
};

export type EmpresaAccess = {
  solucaoIds: number[];
  funcionalidadeIds: number[];
};
