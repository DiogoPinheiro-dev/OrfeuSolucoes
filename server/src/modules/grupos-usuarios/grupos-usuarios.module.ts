import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { GruposUsuariosBootstrap } from './grupos-usuarios.bootstrap';
import { GruposUsuariosResolver } from './grupos-usuarios.resolver';
import { GruposUsuariosService } from './grupos-usuarios.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [GruposUsuariosService, GruposUsuariosResolver, GruposUsuariosBootstrap],
  exports: [GruposUsuariosService]
})
export class GruposUsuariosModule {}
