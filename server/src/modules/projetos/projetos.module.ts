import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoCatalogService } from './projeto-catalog.service';
import { ProjetoEquipeService } from './projeto-equipe.service';
import { ProjetoLifecycleService } from './projeto-lifecycle.service';
import { ProjetoKeyService } from './projeto-key.service';
import { ProjetoQueryService } from './projeto-query.service';
import { ProjetosResolver } from './projetos.resolver';
import { ProjetosService } from './projetos.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [
    ProjetoAuthorizationService,
    ProjetoKeyService,
    ProjetoQueryService,
    ProjetosService,
    ProjetosResolver
  ],
  exports: [ProjetoAuthorizationService, ProjetoCatalogService, ProjetoEquipeService, ProjetoLifecycleService, ProjetoKeyService, ProjetoQueryService, ProjetosService]
})
export class ProjetosModule {}
