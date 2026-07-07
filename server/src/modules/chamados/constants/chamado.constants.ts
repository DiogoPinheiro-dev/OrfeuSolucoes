export const SOLUTION_SLUG = 'controle-de-chamados';

export const FEATURES = {
  abrir: 'abrir-chamado',
  meus: 'meus-chamados',
  painel: 'painel-atendimento',
  arquivados: 'chamados-arquivados',
  categorias: 'categorias',
  tipos: 'tipos',
  prioridades: 'prioridades',
  responsaveis: 'responsaveis'
} as const;

export const STATUS = ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE', 'RESOLVIDO', 'ARQUIVADO'] as const;

export const OPEN_STATUSES = ['ABERTO', 'EM_TRIAGEM', 'EM_ATENDIMENTO', 'PENDENTE'] as const;
export const TERMINAL_STATUSES = ['RESOLVIDO', 'ARQUIVADO'] as const;
export const CLOSED_STATUSES = ['ARQUIVADO'] as const;

export const GENERAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  ABERTO: ['EM_TRIAGEM', 'EM_ATENDIMENTO'],
  EM_TRIAGEM: ['EM_ATENDIMENTO', 'PENDENTE'],
  EM_ATENDIMENTO: ['EM_TRIAGEM', 'PENDENTE'],
  PENDENTE: ['EM_TRIAGEM', 'EM_ATENDIMENTO']
};

export const MAX_ANEXO_FILES = 5;
export const MAX_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ANEXO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);

export const ALLOWED_ANEXO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.txt']);
