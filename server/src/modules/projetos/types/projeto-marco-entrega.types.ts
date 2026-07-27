import { registerEnumType } from '@nestjs/graphql';

export enum ProjetoMarcoStatus {
  PLANEJADO = 'PLANEJADO',
  ATINGIDO = 'ATINGIDO',
  CANCELADO = 'CANCELADO'
}

export enum ProjetoEntregaStatus {
  PLANEJADA = 'PLANEJADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA'
}

registerEnumType(ProjetoMarcoStatus, { name: 'ProjetoMarcoStatus' });
registerEnumType(ProjetoEntregaStatus, { name: 'ProjetoEntregaStatus' });

export type ProjetoMarcoEntregaPermissoes = {
  podeVisualizar: boolean;
  podeCriar: boolean;
  podeEditar: boolean;
  podeArquivar: boolean;
  podeReativar: boolean;
};
