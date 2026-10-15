import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { GrupoUsuarioCatalogService } from './grupo-usuario-catalog.service';
import { GrupoUsuarioPermissaoService } from './grupo-usuario-permissao.service';
import { GruposUsuariosResolver } from './grupos-usuarios.resolver';
import { GruposUsuariosService } from './grupos-usuarios.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [GruposUsuariosService, GrupoUsuarioCatalogService, GrupoUsuarioPermissaoService, GruposUsuariosResolver],
  exports: [GruposUsuariosService]
})
export class GruposUsuariosModule {}
