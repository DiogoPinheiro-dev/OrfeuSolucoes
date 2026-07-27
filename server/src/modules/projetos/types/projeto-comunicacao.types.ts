export type ProjetoUploadFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export type ProjetoComunicacaoPermissoes = {
  podePublicarAtualizacao: boolean;
  podeEditarAtualizacao: boolean;
  podeComentar: boolean;
  podeModerar: boolean;
  podeGerenciarAnexos: boolean;
};