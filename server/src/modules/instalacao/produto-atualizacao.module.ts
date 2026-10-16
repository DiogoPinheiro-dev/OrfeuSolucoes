import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CatalogoAtualizacaoOperations } from './catalogo-atualizacao.operations';
import { ProdutoAtualizacaoService } from './produto-atualizacao.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [CatalogoAtualizacaoOperations, ProdutoAtualizacaoService],
  exports: [ProdutoAtualizacaoService]
})
export class ProdutoAtualizacaoModule {}
