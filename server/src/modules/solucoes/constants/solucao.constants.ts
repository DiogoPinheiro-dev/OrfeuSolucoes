import { FuncionalidadeAcaoInput } from '../dto/funcionalidade-acao.input';

export const DEFAULT_ACTIONS: FuncionalidadeAcaoInput[] = [
  { chave: 'visualizar', nome: 'Visualizar', ordem: 10, ativo: true, acaoPadrao: true },
  { chave: 'incluir', nome: 'Incluir', ordem: 20, ativo: true, acaoPadrao: true },
  { chave: 'alterar', nome: 'Alterar', ordem: 30, ativo: true, acaoPadrao: true },
  { chave: 'excluir', nome: 'Excluir', ordem: 40, ativo: true, acaoPadrao: true }
];

export const DEFAULT_CHAMADO_TIPOS = [
  { nome: 'Solicitacao', cor: '#ea580c', ordem: 10 },
  { nome: 'Incidente', cor: '#dc2626', ordem: 20 },
  { nome: 'Duvida', cor: '#16a34a', ordem: 30 },
  { nome: 'Melhoria', cor: '#f59e0b', ordem: 40 }
] as const;

export const DEFAULT_CHAMADO_PRIORIDADES = [
  { nome: 'Baixa', cor: '#16a34a', ordem: 10 },
  { nome: 'Media', cor: '#f59e0b', ordem: 20 },
  { nome: 'Alta', cor: '#ea580c', ordem: 30 },
  { nome: 'Urgente', cor: '#dc2626', ordem: 40 }
] as const;
