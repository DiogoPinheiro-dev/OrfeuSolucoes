import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeAuthorizationService } from './funcionalidade-authorization.service';
import { HubNavigationService } from './hub-navigation.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { SolucaoBootstrapService } from './solucao-bootstrap.service';
import { SolucaoChamadosBootstrapService } from './solucao-chamados-bootstrap.service';
import { SolucaoProjetosBootstrapService } from './solucao-projetos-bootstrap.service';
import { SolucaoCatalogService } from './solucao-catalog.service';
import { SolucaoQueryService } from './solucao-query.service';
import { SolucoesResolver } from './solucoes.resolver';
import { SolucoesService } from './solucoes.service';

@Module({
  imports: [PrismaModule],
  providers: [FuncionalidadeAcaoService, FuncionalidadeAuthorizationService, HubNavigationService, SolucaoAcessoService, SolucaoBootstrapService, SolucaoChamadosBootstrapService, SolucaoProjetosBootstrapService, SolucaoCatalogService, SolucaoQueryService, SolucoesService, SolucoesResolver],
  exports: [FuncionalidadeAcaoService, FuncionalidadeAuthorizationService, HubNavigationService, SolucaoAcessoService, SolucaoBootstrapService, SolucaoChamadosBootstrapService, SolucaoProjetosBootstrapService, SolucaoCatalogService, SolucaoQueryService, SolucoesService]
})
export class SolucoesModule {}
