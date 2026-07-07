export type UsuarioResumoRecord = {
  id: string;
  nome?: string | null;
  login?: string | null;
  email: string;
};

export type GrupoResumoRecord = {
  id: number;
  nome: string;
  descricao?: string | null;
};

export type ChamadoCategoriaRecord = {
  id: number;
  empresaId: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ChamadoConfiguracaoRecord = {
  id: number;
  empresaId: number;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  ordem: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ChamadoResponsavelFuncionalidadeRecord = {
  id: number;
  responsavelSolucaoId: number;
  funcionalidadeId: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  funcionalidade?: { id: number; titulo: string; label?: string | null; slug: string } | null;
};

export type ChamadoResponsavelSolucaoRecord = {
  id: number;
  responsavelId: number;
  solucaoId: number;
  responsavelGeral: boolean;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  solucao?: { id: number; nome: string; slug: string } | null;
  funcionalidades?: ChamadoResponsavelFuncionalidadeRecord[];
};

export type ChamadoResponsavelRecord = {
  id: number;
  empresaId: number;
  tipo: string;
  usuarioId?: string | null;
  grupoId?: number | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  usuario?: UsuarioResumoRecord | null;
  grupo?: GrupoResumoRecord | null;
  solucoes?: ChamadoResponsavelSolucaoRecord[];
};

export type ResponsavelSolucaoPayload = {
  solucaoId: number;
  responsavelGeral: boolean;
  funcionalidadeIds: number[];
};

export type ResponsavelAlvoPayload = {
  tipo: 'USUARIO' | 'GRUPO';
  usuarioId: string | null;
  grupoId: number | null;
};

export type ResponsavelAberturaPayload = {
  responsavelId: string | null;
  responsavelGrupoId: number | null;
};

export type ChamadoUploadFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export type ChamadoAnexoRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  autorId: string;
  mensagemId?: string | null;
  nomeOriginal: string;
  nomeArquivo: string;
  caminho: string;
  mimeType: string;
  tamanho: number;
  criadoEm: Date;
  autor?: UsuarioResumoRecord | null;
};

export type ChamadoAcompanhanteRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  usuarioId: string;
  adicionadoPorId?: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  usuario?: UsuarioResumoRecord | null;
  adicionadoPor?: UsuarioResumoRecord | null;
};

export type ChamadoMensagemRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  autorId: string;
  tipo: string;
  conteudo: string;
  criadoEm: Date;
  autor?: UsuarioResumoRecord | null;
  anexos?: ChamadoAnexoRecord[];
};

export type ChamadoHistoricoRecord = {
  id: string;
  chamadoId: string;
  empresaId: number;
  usuarioId?: string | null;
  evento: string;
  campo?: string | null;
  valorAnterior?: string | null;
  valorNovo?: string | null;
  observacao?: string | null;
  criadoEm: Date;
  usuario?: UsuarioResumoRecord | null;
};

export type ChamadoRecord = {
  id: string;
  numero: number;
  empresaId: number;
  solicitanteId: string;
  responsavelId?: string | null;
  responsavelGrupoId?: number | null;
  liderAtendimentoId?: string | null;
  atendimentoAssumidoEm?: Date | null;
  categoriaId?: number | null;
  solucaoId?: number | null;
  funcionalidadeId?: number | null;
  titulo: string;
  descricao: string;
  tipoId: number;
  prioridadeId: number;
  status: string;
  criadoEm: Date;
  atualizadoEm: Date;
  primeiraRespostaEm?: Date | null;
  resolvidoEm?: Date | null;
  encerradoEm?: Date | null;
  versao: number;
  solicitante?: UsuarioResumoRecord | null;
  responsavel?: UsuarioResumoRecord | null;
  responsavelGrupo?: GrupoResumoRecord | null;
  liderAtendimento?: UsuarioResumoRecord | null;
  categoria?: ChamadoCategoriaRecord | null;
  tipoConfiguracao?: ChamadoConfiguracaoRecord | null;
  prioridadeConfiguracao?: ChamadoConfiguracaoRecord | null;
  solucao?: { id: number; nome: string; slug: string } | null;
  funcionalidade?: { id: number; titulo: string; label?: string | null; slug: string } | null;
  mensagens?: ChamadoMensagemRecord[];
  historico?: ChamadoHistoricoRecord[];
  anexos?: ChamadoAnexoRecord[];
  acompanhantes?: ChamadoAcompanhanteRecord[];
};

