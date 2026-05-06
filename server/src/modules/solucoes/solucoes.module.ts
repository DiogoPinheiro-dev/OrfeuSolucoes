import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesResolver } from './solucoes.resolver';
import { SolucoesService } from './solucoes.service';

@Module({
  imports: [PrismaModule],
  providers: [SolucoesService, SolucoesResolver],
  exports: [SolucoesService]
})
export class SolucoesModule {}
