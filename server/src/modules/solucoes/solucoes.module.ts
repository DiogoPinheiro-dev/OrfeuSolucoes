import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeAgrupamentoService } from './funcionalidade-agrupamento.service';
import { FuncionalidadeAuthorizationService } from './funcionalidade-authorization.service';
import { ChamadoConfiguracaoPadraoService } from './chamado-configuracao-padrao.service';
import { HubNavigationService } from './hub-navigation.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { SolucaoCatalogService } from './solucao-catalog.service';
import { SolucaoQueryService } from './solucao-query.service';
import { SolucoesResolver } from './solucoes.resolver';
import { SolucoesService } from './solucoes.service';
import { CatalogoProviderRegistry } from './catalogo-provider.registry';
import { CatalogoValidationService } from './catalogo-validation.service';
import { CatalogoLifecycleService } from './catalogo-lifecycle.service';
import { CatalogoResolver } from './catalogo.resolver';
import { CatalogoActionConsumerRegistry } from './catalogo-action-consumer.registry';
import { CatalogoBootstrapReconciliationService } from './catalogo-bootstrap-reconciliation.service';

@Module({
  imports: [PrismaModule],
  providers: [CatalogoProviderRegistry, CatalogoActionConsumerRegistry, CatalogoBootstrapReconciliationService, CatalogoValidationService, CatalogoLifecycleService, CatalogoResolver, ChamadoConfiguracaoPadraoService, FuncionalidadeAcaoService, FuncionalidadeAgrupamentoService, FuncionalidadeAuthorizationService, HubNavigationService, SolucaoAcessoService, SolucaoCatalogService, SolucaoQueryService, SolucoesService, SolucoesResolver],
  exports: [CatalogoProviderRegistry, CatalogoActionConsumerRegistry, CatalogoValidationService, CatalogoLifecycleService, FuncionalidadeAcaoService, FuncionalidadeAuthorizationService, HubNavigationService, SolucaoAcessoService, SolucaoCatalogService, SolucaoQueryService, SolucoesService]
})
export class SolucoesModule {}
