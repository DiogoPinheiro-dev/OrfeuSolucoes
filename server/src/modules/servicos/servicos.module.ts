import { Module } from '@nestjs/common';
import { ServicosResolver } from './servicos.resolver';
import { ServicosService } from './servicos.service';

@Module({
  providers: [ServicosResolver, ServicosService]
})
export class ServicosModule {}
