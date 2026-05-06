export type JwtPayload = {
  sub: string;
  email: string;
  login?: string | null;
  nome?: string | null;
  grupo?: {
    id: number;
    nome: string;
    descricao?: string | null;
    acessoEcommerce: boolean;
    acessoProjetos: boolean;
    acessoHoras: boolean;
    acessoConfigurador: boolean;
    podeVisualizar?: boolean;
    podeIncluir?: boolean;
    podeAlterar?: boolean;
    podeExcluir?: boolean;
  } | null;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
  deveAlterarSenha?: boolean;
  empresaId?: number | null;
  empresaNome?: string | null;
  availableSolutions?: string[];
};
