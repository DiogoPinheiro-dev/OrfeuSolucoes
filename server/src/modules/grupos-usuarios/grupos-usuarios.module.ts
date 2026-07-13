import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { GrupoUsuarioBootstrapService } from './grupo-usuario-bootstrap.service';
import { GrupoUsuarioCatalogService } from './grupo-usuario-catalog.service';
import { GrupoUsuarioPermissaoService } from './grupo-usuario-permissao.service';
import { GruposUsuariosBootstrap } from './grupos-usuarios.bootstrap';
import { GruposUsuariosResolver } from './grupos-usuarios.resolver';
import { GruposUsuariosService } from './grupos-usuarios.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [GruposUsuariosService, GrupoUsuarioBootstrapService, GrupoUsuarioCatalogService, GrupoUsuarioPermissaoService, GruposUsuariosResolver, GruposUsuariosBootstrap],
  exports: [GruposUsuariosService]
})
export class GruposUsuariosModule {}