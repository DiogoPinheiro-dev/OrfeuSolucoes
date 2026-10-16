import { CATALOGO_PRODUTO_2026_10_15 } from '../manifesto/catalogo-produto';
import { ProdutoAtualizacaoDefinition } from './produto-atualizacao';

export const ATUALIZACAO_0001_CONVERGENCIA_CATALOGO: ProdutoAtualizacaoDefinition = {
  id: '0001-convergencia-catalogo-2026-10-15',
  descricao: 'Converge bancos existentes para o catalogo congelado em 2026-10-15.',
  aplicar: ({ database, catalogo }) =>
    catalogo.convergirManifesto(database, CATALOGO_PRODUTO_2026_10_15, '0001-convergencia-catalogo-2026-10-15')
};
