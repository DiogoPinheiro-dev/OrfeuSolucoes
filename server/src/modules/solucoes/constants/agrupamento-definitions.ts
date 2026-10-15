import {
  AgrupamentoProdutoDefinition,
  CONFIGURADOR_PRODUTO,
  CONTROLE_CHAMADOS_PRODUTO,
  PROJETOS_PRODUTO
} from '../../instalacao/manifesto/catalogo-produto';

export type AgrupamentoPadraoDefinition = AgrupamentoProdutoDefinition;

export const CONFIGURADOR_AGRUPAMENTOS_PADRAO = CONFIGURADOR_PRODUTO.agrupamentos;
export const CHAMADOS_AGRUPAMENTOS_PADRAO = CONTROLE_CHAMADOS_PRODUTO.agrupamentos;
export const PROJETOS_AGRUPAMENTOS_PADRAO = PROJETOS_PRODUTO.agrupamentos;
