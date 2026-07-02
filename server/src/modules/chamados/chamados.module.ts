import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';
import { ChamadosController } from './chamados.controller';
import { ChamadosResolver } from './chamados.resolver';
import { ChamadosService } from './chamados.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  controllers: [ChamadosController],
  providers: [ChamadosService, ChamadosResolver, ChamadoAnexoStorageService],
  exports: [ChamadosService]
})
export class ChamadosModule {}
