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
import { ProjetoComunicacaoAuthorizationService } from './projeto-comunicacao-authorization.service';
import { ProjetoComunicacaoController } from './projeto-comunicacao.controller';
import { ProjetoComunicacaoResolver } from './projeto-comunicacao.resolver';
import { ProjetoComunicacaoService } from './projeto-comunicacao.service';
import { ProjetoFeedRegistroService } from './projeto-feed-registro.service';
import { ProjetoOrcamentoAuthorizationService } from './projeto-orcamento-authorization.service';
import { ProjetoOrcamentoResolver } from './projeto-orcamento.resolver';
import { ProjetoOrcamentoService } from './projeto-orcamento.service';
import { ProjetoRecursoAuthorizationService } from './projeto-recurso-authorization.service';
import { ProjetoRecursoResolver } from './projeto-recurso.resolver';
import { ProjetoRecursoService } from './projeto-recurso.service';
import { ProjetoAnexoStorageService } from './projeto-anexo-storage.service';
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
import { ProjetoOrganizacaoResolver } from './projeto-organizacao.resolver';
import { ProjetoOrganizacaoService } from './projeto-organizacao.service';
import { ProjetoEquipeVinculoService } from './projeto-equipe-vinculo.service';
import { ProjetoRecursoHierarquiaService } from './projeto-recurso-hierarquia.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  controllers: [ProjetoComunicacaoController],
  providers: [
    ProjetoAuthorizationService,
    ProjetoBacklogService,
    ProjetoSprintAuthorizationService,
    ProjetoSprintService,
    ProjetoMarcoEntregaAuthorizationService,
    ProjetoMarcoEntregaService,
    ProjetoCronogramaAuthorizationService,
    ProjetoCronogramaService,
    ProjetoComunicacaoAuthorizationService,
    ProjetoFeedRegistroService,
    ProjetoComunicacaoService,
    ProjetoRecursoAuthorizationService,
    ProjetoRecursoService,
    ProjetoOrganizacaoService,
    ProjetoEquipeVinculoService,
    ProjetoRecursoHierarquiaService,
    ProjetoOrcamentoAuthorizationService,
    ProjetoOrcamentoService,
    ProjetoAnexoStorageService,
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
    ProjetoComunicacaoResolver,
    ProjetoRecursoResolver,
    ProjetoOrcamentoResolver,
    ProjetoOrganizacaoResolver,
  ],
  exports: [
    ProjetoAuthorizationService,
    ProjetoBacklogService,
    ProjetoSprintAuthorizationService,
    ProjetoSprintService,
    ProjetoComunicacaoAuthorizationService,
    ProjetoComunicacaoService,
    ProjetoRecursoAuthorizationService,
    ProjetoRecursoService,
    ProjetoOrcamentoAuthorizationService,
    ProjetoOrcamentoService,
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
