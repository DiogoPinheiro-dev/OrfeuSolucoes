import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProdutoAtualizacaoModule } from './produto-atualizacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProdutoAtualizacaoModule
  ]
})
export class ProdutoAtualizarModule {}
