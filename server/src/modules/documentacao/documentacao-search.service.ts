import { Injectable } from '@nestjs/common';
import { DocumentacaoArtigo, DocumentacaoBuscaResultado, DocumentacaoManifestoArtigo } from './documentacao.types';

const normalize = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

@Injectable()
export class DocumentacaoSearchService {
  corresponde(artigo: DocumentacaoArtigo, termo: string): boolean {
    const query = normalize(termo.trim());
    if (!query) return false;
    return normalize([
      artigo.titulo,
      artigo.resumo,
      artigo.conteudo,
      ...artigo.palavrasChave
    ].join(' ')).includes(query);
  }

  resultado(artigo: DocumentacaoArtigo, termo: string): DocumentacaoBuscaResultado {
    return { ...this.metadados(artigo), trecho: this.criarTrecho(artigo, termo) };
  }

  private metadados(artigo: DocumentacaoArtigo): DocumentacaoManifestoArtigo {
    const { conteudo: _conteudo, ...metadados } = artigo;
    return metadados;
  }

  private criarTrecho(artigo: DocumentacaoArtigo, termo: string): string {
    const texto = artigo.conteudo
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#>*_`\[\]()|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const indice = normalize(texto).indexOf(normalize(termo.trim()));
    const inicio = Math.max(0, indice >= 0 ? indice - 80 : 0);
    const fim = Math.min(texto.length, inicio + 240);
    return `${inicio > 0 ? '…' : ''}${texto.slice(inicio, fim).trim()}${fim < texto.length ? '…' : ''}`;
  }
}
