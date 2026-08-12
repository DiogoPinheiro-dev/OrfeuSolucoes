export type DocumentacaoAudiencia = 'usuario' | 'admin-empresa' | 'admin-sistema';
export type DocumentacaoCategoria = 'sistema' | 'solucao';

export type DocumentacaoManifestoArtigo = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  arquivo: string;
  categoria: DocumentacaoCategoria;
  audiencia: DocumentacaoAudiencia;
  status: 'publicado';
  ordem: number;
  validadoEm: string;
  palavrasChave: string[];
  solucao?: string;
  funcionalidade?: string;
  registryKey?: string;
};

export type DocumentacaoManifesto = {
  versaoContrato: number;
  geradoDe: string;
  artigos: DocumentacaoManifestoArtigo[];
};

export type DocumentacaoArtigo = DocumentacaoManifestoArtigo & {
  conteudo: string;
};

export type DocumentacaoBuscaResultado = DocumentacaoManifestoArtigo & {
  trecho: string;
};

export type DocumentacaoFiltro = {
  categoria?: DocumentacaoCategoria;
  solucao?: string;
  registryKey?: string;
};
