import { CatalogoActionSnapshot } from '../types/catalogo-lifecycle.types';

export type CatalogoFeatureSnapshot = {
  solucaoId: number;
  slug: string;
  titulo: string;
  label: string | null;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  registryKey: string | null;
  providerKey: string | null;
  providerVersion: number | null;
  somenteAdminSistema: boolean;
};

export type CatalogoSolutionSnapshot = {
  slug: string;
  nome: string;
  descricao: string | null;
  eyebrow: string | null;
  ordem: number;
  ativo: boolean;
  exibirNoHub: boolean;
  somenteAdminSistema: boolean;
};

export const catalogoSolutionSnapshot = (
  solution: CatalogoSolutionSnapshot
): CatalogoSolutionSnapshot => ({
  slug: solution.slug,
  nome: solution.nome,
  descricao: solution.descricao,
  eyebrow: solution.eyebrow,
  ordem: solution.ordem,
  ativo: solution.ativo,
  exibirNoHub: solution.exibirNoHub,
  somenteAdminSistema: solution.somenteAdminSistema
});

export const catalogoFeatureSnapshot = (
  feature: CatalogoFeatureSnapshot
): CatalogoFeatureSnapshot => ({
  solucaoId: feature.solucaoId,
  slug: feature.slug,
  titulo: feature.titulo,
  label: feature.label,
  descricao: feature.descricao,
  ordem: feature.ordem,
  ativo: feature.ativo,
  registryKey: feature.registryKey,
  providerKey: feature.providerKey,
  providerVersion: feature.providerVersion,
  somenteAdminSistema: feature.somenteAdminSistema
});

export const catalogoActionSnapshot = (
  action: CatalogoActionSnapshot
): CatalogoActionSnapshot => ({
  funcionalidadeId: action.funcionalidadeId,
  chave: action.chave,
  nome: action.nome,
  descricao: action.descricao,
  ordem: action.ordem,
  ativo: action.ativo,
  configuracao: action.configuracao,
  consumerKey: action.consumerKey,
  consumerVersion: action.consumerVersion
});
