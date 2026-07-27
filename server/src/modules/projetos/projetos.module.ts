import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoBacklogService } from './projeto-backlog.service';
import { ProjetoSprintAuthorizationService } from './projeto-sprint-authorization.service';
import { ProjetoSprintResolver } from './projeto-sprint.resolver';
import { ProjetoSprintService } from './projeto-sprint.service';
import { ProjetoMarcoEntregaAuthorizationService } from './projeto-marco-entrega-authorization.service';
import { ProjetoMarcoEntregaResolver } from './projeto-marco-entrega.resolver';
import { ProjetoMarcoEntregaService } from './projeto-marco-entrega.service';
import { ProjetoCronogramaAuthorizationService } from './projeto-cronograma-authorization.service';
import { ProjetoCronogramaResolver } from './projeto-cronograma.resolver';
import { ProjetoCronogramaService } from './projeto-cronograma.service';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoIdempotenciaService } from './projeto-idempotencia.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';
import { ProjetoSequenciaService } from './projeto-sequencia.service';
import { ProjetoCatalogService } from './projeto-catalog.service';
import { ProjetoEquipeService } from './projeto-equipe.service';
import { ProjetoLifecycleService } from './projeto-lifecycle.service';
import { ProjetoKeyService } from './projeto-key.service';
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';
import { ProjetoItemCatalogService } from './projeto-item-catalog.service';
import { ProjetoItemHierarquiaService } from './projeto-item-hierarquia.service';
import { ProjetoItemQueryService } from './projeto-item-query.service';
import { ProjetoQueryService } from './projeto-query.service';
import { ProjetosResolver } from './projetos.resolver';
import { ProjetosService } from './projetos.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  providers: [
    ProjetoAuthorizationService,
    ProjetoBacklogService,
    ProjetoSprintAuthorizationService,
    ProjetoSprintService,
    ProjetoMarcoEntregaAuthorizationService,
    ProjetoMarcoEntregaService,
    ProjetoCronogramaAuthorizationService,
    ProjetoCronogramaService,
    ProjetoAuditoriaService,
    ProjetoIdempotenciaService,
    ProjetoPeriodoService,
    ProjetoSequenciaService,
    ProjetoCatalogService,
    ProjetoEquipeService,
    ProjetoLifecycleService,
    ProjetoKeyService,
    ProjetoItemAuthorizationService,
    ProjetoItemCatalogService,
    ProjetoItemHierarquiaService,
    ProjetoItemQueryService,
    ProjetoQueryService,
    ProjetosService,
    ProjetosResolver,
    ProjetoSprintResolver,
    ProjetoMarcoEntregaResolver,
    ProjetoCronogramaResolver,
  ],
  exports: [
    ProjetoAuthorizationService,
    ProjetoBacklogService,
    ProjetoSprintAuthorizationService,
    ProjetoSprintService,
    ProjetoAuditoriaService,
    ProjetoCatalogService,
    ProjetoEquipeService,
    ProjetoIdempotenciaService,
    ProjetoLifecycleService,
    ProjetoPeriodoService,
    ProjetoKeyService,
    ProjetoItemAuthorizationService,
    ProjetoItemCatalogService,
    ProjetoItemHierarquiaService,
    ProjetoItemQueryService,
    ProjetoQueryService,
    ProjetoSequenciaService,
    ProjetosService
  ]
})
export class ProjetosModule {}
