import { NestFactory } from '@nestjs/core';
import { InstalacaoSeedModule } from './instalacao-seed.module';
import { InstalacaoService } from './instalacao.service';

async function seed(): Promise<void> {
  const context = await NestFactory.createApplicationContext(InstalacaoSeedModule);
  try {
    await context.get(InstalacaoService).verificarSubida();
  } finally {
    await context.close();
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
