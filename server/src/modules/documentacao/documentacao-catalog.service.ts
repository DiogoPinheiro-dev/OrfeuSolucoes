import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { DOCUMENTACAO_ROOT } from './documentacao.constants';
import { DocumentacaoArtigo, DocumentacaoManifesto, DocumentacaoManifestoArtigo } from './documentacao.types';

@Injectable()
export class DocumentacaoCatalogService {
  private manifesto?: DocumentacaoManifesto;

  constructor(@Inject(DOCUMENTACAO_ROOT) private readonly documentacaoRoot: string) {}

  async listar(): Promise<DocumentacaoManifestoArtigo[]> {
    const manifesto = await this.carregarManifesto();
    return manifesto.artigos.map((artigo) => ({ ...artigo, palavrasChave: [...artigo.palavrasChave] }));
  }

  async buscarPorSlug(slug: string): Promise<DocumentacaoManifestoArtigo | undefined> {
    const artigos = await this.listar();
    return artigos.find((artigo) => artigo.slug === slug);
  }

  async carregarArtigo(metadados: DocumentacaoManifestoArtigo): Promise<DocumentacaoArtigo> {
    const caminho = this.resolverCaminhoSeguro(metadados.arquivo);
    try {
      const conteudo = await readFile(caminho, 'utf8');
      return { ...metadados, palavrasChave: [...metadados.palavrasChave], conteudo };
    } catch {
      throw new InternalServerErrorException('Conteudo da documentacao indisponivel.');
    }
  }

  private async carregarManifesto(): Promise<DocumentacaoManifesto> {
    if (this.manifesto) return this.manifesto;
    const caminho = resolve(this.documentacaoRoot, 'generated/documentacao-manifest.json');
    try {
      const parsed = JSON.parse(await readFile(caminho, 'utf8')) as DocumentacaoManifesto;
      if (parsed.versaoContrato !== 1 || !Array.isArray(parsed.artigos)) throw new Error('Manifesto invalido');
      this.manifesto = parsed;
      return parsed;
    } catch {
      throw new InternalServerErrorException('Catalogo da documentacao indisponivel.');
    }
  }

  private resolverCaminhoSeguro(arquivo: string): string {
    const caminho = resolve(this.documentacaoRoot, arquivo);
    const relativo = relative(this.documentacaoRoot, caminho);
    if (relativo.startsWith('..') || isAbsolute(relativo)) {
      throw new InternalServerErrorException('Caminho de documentacao invalido.');
    }
    return caminho;
  }
}
