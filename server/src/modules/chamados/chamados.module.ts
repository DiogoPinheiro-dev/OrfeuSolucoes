import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ChamadosResolver } from './chamados.resolver';
import { ChamadosService } from './chamados.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [ChamadosService, ChamadosResolver],
  exports: [ChamadosService]
})
export class ChamadosModule {}
