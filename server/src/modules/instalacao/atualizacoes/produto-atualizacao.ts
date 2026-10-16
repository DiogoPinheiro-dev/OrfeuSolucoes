import { Prisma } from '@prisma/client';
import { CatalogoAtualizacaoOperations, ResumoConvergenciaCatalogo } from '../catalogo-atualizacao.operations';

export type ProdutoAtualizacaoContexto = {
  database: Prisma.TransactionClient;
  catalogo: CatalogoAtualizacaoOperations;
};

export type ProdutoAtualizacaoResumo = ResumoConvergenciaCatalogo | Record<string, unknown>;

export type ProdutoAtualizacaoDefinition = {
  id: string;
  descricao: string;
  aplicar(contexto: ProdutoAtualizacaoContexto): Promise<ProdutoAtualizacaoResumo>;
};
