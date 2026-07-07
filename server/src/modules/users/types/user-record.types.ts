import { Empresa, EmpresaUsuario, Usuario } from '@prisma/client';

export type UserGroupRecord = {
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
};

export type UsuarioWithRole = Usuario & {
  login?: string | null;
  grupoId?: number | null;
  grupo?: UserGroupRecord | null;
  deveAlterarSenha?: boolean;
  empresas?: (EmpresaUsuario & { empresa?: Empresa | null })[];
  empresa?: Empresa | null;
  empresasVinculadas?: Empresa[];
};
