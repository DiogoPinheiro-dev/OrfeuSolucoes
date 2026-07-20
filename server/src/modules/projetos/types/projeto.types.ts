import { registerEnumType } from '@nestjs/graphql';

export enum ProjetoMetodologia {
  SCRUM = 'SCRUM',
  KANBAN = 'KANBAN',
  HIBRIDA = 'HIBRIDA',
  OUTRA = 'OUTRA'
}

export enum ProjetoSituacao {
  RASCUNHO = 'RASCUNHO',
  PLANEJADO = 'PLANEJADO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  PAUSADO = 'PAUSADO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export enum ProjetoSaude {
  EM_DIA = 'EM_DIA',
  EM_RISCO = 'EM_RISCO',
  ATRASADO = 'ATRASADO'
}

export enum ProjetoPapel {
  RESPONSAVEL = 'RESPONSAVEL',
  MEMBRO = 'MEMBRO',
  OBSERVADOR = 'OBSERVADOR'
}

registerEnumType(ProjetoMetodologia, { name: 'ProjetoMetodologia' });
registerEnumType(ProjetoSituacao, { name: 'ProjetoSituacao' });
registerEnumType(ProjetoSaude, { name: 'ProjetoSaude' });
registerEnumType(ProjetoPapel, { name: 'ProjetoPapel' });

export type ProjetoUsuarioRecord = {
  id: string;
  nome?: string | null;
  login?: string | null;
  email: string;
  grupo?: { id: number; nome: string } | null;
};

export type ProjetoMembroRecord = {
  id: number;
  projetoId: string;
  usuarioId: string;
  papel: string;
  incluidoEm: Date;
  usuario: ProjetoUsuarioRecord;
};

export type ProjetoRecord = {
  id: string;
  empresaId: number;
  chave: string;
  nome: string;
  objetivo?: string | null;
  descricao?: string | null;
  metodologia: string;
  situacao: string;
  saude: string;
  inicioPrevistoEm?: Date | null;
  fimPrevistoEm?: Date | null;
  inicioRealEm?: Date | null;
  fimRealEm?: Date | null;
  responsavelId: string;
  criadoPorId: string;
  arquivadoEm?: Date | null;
  arquivadoPorId?: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  responsavel: ProjetoUsuarioRecord;
  criadoPor: ProjetoUsuarioRecord;
  arquivadoPor?: ProjetoUsuarioRecord | null;
  membros: ProjetoMembroRecord[];
};

export type ProjetoPermissoesEfetivas = {
  podeVisualizar: boolean;
  podeAlterar: boolean;
  podeGerenciarMembros: boolean;
  podeAlterarStatus: boolean;
  podeArquivar: boolean;
  podeReativar: boolean;
};
