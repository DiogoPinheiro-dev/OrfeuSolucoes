import { NestFactory } from '@nestjs/core';
import { ProdutoAtualizacaoService } from './produto-atualizacao.service';
import { ProdutoAtualizarModule } from './produto-atualizar.module';

async function atualizarProduto(): Promise<void> {
  const contexto = await NestFactory.createApplicationContext(ProdutoAtualizarModule);
  try {
    await contexto.get(ProdutoAtualizacaoService).aplicarPendentes();
  } finally {
    await contexto.close();
  }
}

atualizarProduto().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
