import { registerEnumType } from '@nestjs/graphql';

export enum ProjetoOrcamentoStatus { RASCUNHO = 'RASCUNHO', APROVADO = 'APROVADO' }
export enum ProjetoCustoTipo { FIXO = 'FIXO', RECURSO = 'RECURSO' }
registerEnumType(ProjetoOrcamentoStatus, { name: 'ProjetoOrcamentoStatus' });
registerEnumType(ProjetoCustoTipo, { name: 'ProjetoCustoTipo' });

export type ProjetoOrcamentoPermissoes = {
  podeVisualizarFinanceiro: boolean;
  podeGerenciarFinanceiro: boolean;
  podeAprovarOrcamento: boolean;
};
