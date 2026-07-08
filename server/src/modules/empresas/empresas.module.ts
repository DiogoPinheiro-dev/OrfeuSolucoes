import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { EmpresaAcessoService } from './empresa-acesso.service';
import { EmpresaAdminService } from './empresa-admin.service';
import { EmpresaCatalogService } from './empresa-catalog.service';
import { EmpresasResolver } from './empresas.resolver';
import { EmpresasService } from './empresas.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [EmpresasResolver, EmpresasService, EmpresaAcessoService, EmpresaAdminService, EmpresaCatalogService],
  exports: [EmpresasService]
})
export class EmpresasModule {}
