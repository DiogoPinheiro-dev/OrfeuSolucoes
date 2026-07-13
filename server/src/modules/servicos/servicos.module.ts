import { Module } from '@nestjs/common';
import { ServicoCatalogService } from './servico-catalog.service';
import { ServicosResolver } from './servicos.resolver';
import { ServicosService } from './servicos.service';

@Module({
  providers: [ServicosResolver, ServicosService, ServicoCatalogService]
})
export class ServicosModule {}
