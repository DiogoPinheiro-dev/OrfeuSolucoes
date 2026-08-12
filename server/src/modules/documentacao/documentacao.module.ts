import { Module } from '@nestjs/common';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { DocumentacaoAuthorizationService } from './documentacao-authorization.service';
import { DocumentacaoCatalogService } from './documentacao-catalog.service';
import { DocumentacaoResolver } from './documentacao.resolver';
import { DocumentacaoSearchService } from './documentacao-search.service';
import { DocumentacaoService } from './documentacao.service';
import { documentacaoRootProvider } from './documentacao-root.provider';

@Module({
  imports: [SolucoesModule],
  providers: [
    documentacaoRootProvider,
    DocumentacaoCatalogService,
    DocumentacaoAuthorizationService,
    DocumentacaoSearchService,
    DocumentacaoService,
    DocumentacaoResolver
  ],
  exports: [DocumentacaoService]
})
export class DocumentacaoModule {}
