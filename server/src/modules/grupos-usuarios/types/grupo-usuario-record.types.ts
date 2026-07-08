import { FuncionalidadePermissao } from '../../solucoes/solucoes.service';

export type GrupoUsuarioRecord = {
  id: number;
  nome: string;
  descricao?: string | null;
  acessoEcommerce?: boolean;
  acessoProjetos?: boolean;
  acessoHoras?: boolean;
  acessoConfigurador?: boolean;
  padraoSistema?: boolean;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
  solucaoIds?: number[];
  funcionalidadeIds?: number[];
  funcionalidadePermissoes?: FuncionalidadePermissao[];
};
