import { Module } from '@nestjs/common';
import { InstalacaoBootstrap } from './instalacao.bootstrap';
import { InstalacaoCoreModule } from './instalacao-core.module';

@Module({
  imports: [InstalacaoCoreModule],
  providers: [InstalacaoBootstrap]
})
export class InstalacaoModule {}
