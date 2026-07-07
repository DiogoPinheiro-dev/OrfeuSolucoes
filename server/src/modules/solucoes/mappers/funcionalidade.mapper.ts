import { FuncionalidadeAcaoType } from '../dto/funcionalidade-acao.type';
import { FuncionalidadeType } from '../dto/funcionalidade.type';
import { FuncionalidadePermissao } from '../types/permissao.types';
import { FuncionalidadeAcaoRecord, FuncionalidadeRecord } from '../types/solucao-record.types';
import { legacyActionAllowed, withLegacyPermissions } from '../utils/acao-permissao.util';

export function toFuncionalidadeType(funcionalidade: FuncionalidadeRecord): FuncionalidadeType {
  return {
    id: funcionalidade.id,
    slug: funcionalidade.slug,
    titulo: funcionalidade.titulo,
    label: funcionalidade.label ?? null,
    descricao: funcionalidade.descricao ?? null,
    ordem: funcionalidade.ordem,
    ativo: funcionalidade.ativo,
    registryKey: funcionalidade.registryKey ?? null,
    somenteAdminSistema: funcionalidade.somenteAdminSistema,
    podeVisualizar: funcionalidade.podeVisualizar ?? true,
    podeIncluir: funcionalidade.podeIncluir ?? false,
    podeAlterar: funcionalidade.podeAlterar ?? false,
    podeExcluir: funcionalidade.podeExcluir ?? false,
    acoes: (funcionalidade.acoes ?? []).map((acao) => toFuncionalidadeAcaoType(acao))
  };
}

export function toFuncionalidadeAcaoType(acao: FuncionalidadeAcaoRecord): FuncionalidadeAcaoType {
  return {
    id: acao.id,
    funcionalidadeId: acao.funcionalidadeId,
    chave: acao.chave,
    nome: acao.nome,
    descricao: acao.descricao ?? null,
    ordem: acao.ordem,
    ativo: acao.ativo,
    acaoPadrao: acao.acaoPadrao,
    configuracao: acao.configuracao ?? null,
    permitido: acao.permitido ?? false
  };
}

export function withPermissions(funcionalidade: FuncionalidadeType, permissao?: FuncionalidadePermissao): FuncionalidadeType {
  const normalizedPermission = withLegacyPermissions(permissao);
  const acoesPermitidas = new Map((permissao?.acoes ?? []).map((acao) => [acao.acaoId, !!acao.permitido]));
  const acoes = funcionalidade.acoes.map((acao) => ({
    ...acao,
    permitido: acoesPermitidas.has(acao.id)
      ? !!acoesPermitidas.get(acao.id)
      : legacyActionAllowed(acao.chave, normalizedPermission)
  }));

  return {
    ...funcionalidade,
    podeVisualizar: normalizedPermission.podeVisualizar,
    podeIncluir: normalizedPermission.podeIncluir,
    podeAlterar: normalizedPermission.podeAlterar,
    podeExcluir: normalizedPermission.podeExcluir,
    acoes
  };
}

export function withAllPermissions(funcionalidade: FuncionalidadeType): FuncionalidadeType {
  return {
    ...funcionalidade,
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: true,
    acoes: funcionalidade.acoes.map((acao) => ({ ...acao, permitido: true }))
  };
}
