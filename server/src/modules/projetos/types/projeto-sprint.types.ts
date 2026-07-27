import { registerEnumType } from '@nestjs/graphql';

export enum ProjetoSprintStatus {
  PLANEJADA = 'PLANEJADA',
  ATIVA = 'ATIVA',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA'
}

export enum ProjetoSprintDestinoIncompletos {
  BACKLOG = 'BACKLOG',
  SPRINT = 'SPRINT'
}

registerEnumType(ProjetoSprintStatus, { name: 'ProjetoSprintStatus' });
registerEnumType(ProjetoSprintDestinoIncompletos, {
  name: 'ProjetoSprintDestinoIncompletos'
});

export type ProjetoSprintPermissoesEfetivas = {
  podeVisualizar: boolean;
  podeCriar: boolean;
  podeEditar: boolean;
  podePlanejar: boolean;
  podeIniciar: boolean;
  podeConcluir: boolean;
  podeCancelar: boolean;
};
