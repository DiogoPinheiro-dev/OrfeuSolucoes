import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { DocumentacaoAuthorizationService } from './documentacao-authorization.service';
import { DocumentacaoCatalogService } from './documentacao-catalog.service';
import { DocumentacaoSearchService } from './documentacao-search.service';
import { DocumentacaoArtigo, DocumentacaoBuscaResultado, DocumentacaoFiltro, DocumentacaoManifestoArtigo } from './documentacao.types';

@Injectable()
export class DocumentacaoService {
  constructor(
    private readonly catalogService: DocumentacaoCatalogService,
    private readonly authorizationService: DocumentacaoAuthorizationService,
    private readonly searchService: DocumentacaoSearchService
  ) {}

  async indice(user: JwtPayload, filtro?: DocumentacaoFiltro): Promise<DocumentacaoManifestoArtigo[]> {
    const autorizados = await this.authorizationService.filtrarAutorizados(await this.catalogService.listar(), user);
    return this.aplicarFiltro(autorizados, filtro);
  }

  async artigo(slug: string, user: JwtPayload): Promise<DocumentacaoArtigo> {
    const metadados = await this.catalogService.buscarPorSlug(slug);
    if (!metadados || !(await this.authorizationService.podeVisualizar(metadados, user))) {
      throw new NotFoundException('Artigo de documentacao nao encontrado.');
    }
    return this.catalogService.carregarArtigo(metadados);
  }

  async buscar(termo: string, user: JwtPayload, filtro?: DocumentacaoFiltro): Promise<DocumentacaoBuscaResultado[]> {
    const query = termo.trim();
    if (query.length < 2 || query.length > 120) return [];
    const metadados = await this.indice(user, filtro);
    const artigos = await Promise.all(metadados.map((artigo) => this.catalogService.carregarArtigo(artigo)));
    return artigos.filter((artigo) => this.searchService.corresponde(artigo, query)).map((artigo) => this.searchService.resultado(artigo, query));
  }

  private aplicarFiltro(artigos: DocumentacaoManifestoArtigo[], filtro?: DocumentacaoFiltro): DocumentacaoManifestoArtigo[] {
    return artigos.filter((artigo) =>
      (!filtro?.categoria || artigo.categoria === filtro.categoria)
      && (!filtro?.solucao || artigo.solucao === filtro.solucao)
      && (!filtro?.registryKey || artigo.registryKey === filtro.registryKey)
    );
  }
}
