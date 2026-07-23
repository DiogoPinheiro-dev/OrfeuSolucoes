import { registerEnumType } from '@nestjs/graphql';
import { ProjetoPapel, ProjetoRecord, ProjetoUsuarioRecord } from './projeto.types';

export enum ProjetoItemTipo {
  TAREFA = 'TAREFA',
  HISTORIA = 'HISTORIA',
  BUG = 'BUG',
  MELHORIA = 'MELHORIA'
}

export enum ProjetoItemStatus {
  ABERTO = 'ABERTO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export enum ProjetoItemPrioridade {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

registerEnumType(ProjetoItemTipo, { name: 'ProjetoItemTipo' });
registerEnumType(ProjetoItemStatus, { name: 'ProjetoItemStatus' });
registerEnumType(ProjetoItemPrioridade, { name: 'ProjetoItemPrioridade' });

export type ProjetoItemRecord = {
  id: string;
  empresaId: number;
  projetoId: string;
  numero: number;
  chave: string;
  ordemBacklog: number;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  status: string;
  prioridade: string;
  responsavelId?: string | null;
  autorId: string;
  paiId?: string | null;
  inicioPrevistoEm?: Date | null;
  fimPrevistoEm?: Date | null;
  estimativaMinutos?: number | null;
  concluidoEm?: Date | null;
  versao: number;
  arquivadoEm?: Date | null;
  arquivadoPorId?: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  responsavel?: ProjetoUsuarioRecord | null;
  autor: ProjetoUsuarioRecord;
  arquivadoPor?: ProjetoUsuarioRecord | null;
};

export type ProjetoItemPermissoesEfetivas = {
  podeVisualizar: boolean;
  podeCriar: boolean;
  podeAlterar: boolean;
  podeAlterarStatus: boolean;
  podeArquivar: boolean;
  podeReativar: boolean;
  podePriorizar: boolean;
};

export type ProjetoItemContexto = {
  empresaId: number;
  projeto: ProjetoRecord;
  papel: ProjetoPapel | null;
};
