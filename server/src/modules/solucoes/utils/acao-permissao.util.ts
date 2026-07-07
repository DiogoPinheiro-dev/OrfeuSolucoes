import { FuncionalidadePermissao } from '../types/permissao.types';

const LEGACY_ACTION_FIELDS: Record<string, keyof Pick<FuncionalidadePermissao, 'podeVisualizar' | 'podeIncluir' | 'podeAlterar' | 'podeExcluir'>> = {
  visualizar: 'podeVisualizar',
  incluir: 'podeIncluir',
  alterar: 'podeAlterar',
  excluir: 'podeExcluir'
};

export function normalizeActionKey(chave: string): string {
  return chave.trim().toLowerCase();
}

export function comparableActionKey(value?: string | null): string {
  return (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function withLegacyPermissions(permissao?: FuncionalidadePermissao): Required<FuncionalidadePermissao> {
  const actionValues = new Map((permissao?.acoes ?? []).map((acao) => [acao.chave, !!acao.permitido]));

  return {
    funcionalidadeId: permissao?.funcionalidadeId ?? 0,
    podeVisualizar: actionValues.has('visualizar') ? !!actionValues.get('visualizar') : permissao?.podeVisualizar ?? true,
    podeIncluir: actionValues.has('incluir') ? !!actionValues.get('incluir') : permissao?.podeIncluir ?? false,
    podeAlterar: actionValues.has('alterar') ? !!actionValues.get('alterar') : permissao?.podeAlterar ?? false,
    podeExcluir: actionValues.has('excluir') ? !!actionValues.get('excluir') : permissao?.podeExcluir ?? false,
    acoes: permissao?.acoes ?? []
  };
}

export function legacyActionAllowed(chave: string, permissao: Required<FuncionalidadePermissao>): boolean {
  const field = LEGACY_ACTION_FIELDS[chave];

  return field ? !!permissao[field] : false;
}
