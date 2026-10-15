import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { CatalogoInstalacaoOperations } from './catalogo-instalacao.operations';
import { InstalacaoService } from './instalacao.service';

@Module({
  imports: [ConfigModule, PrismaModule, SolucoesModule],
  providers: [CatalogoInstalacaoOperations, InstalacaoService],
  exports: [InstalacaoService]
})
export class InstalacaoCoreModule {}
