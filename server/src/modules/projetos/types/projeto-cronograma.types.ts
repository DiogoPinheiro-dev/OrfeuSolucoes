import { registerEnumType } from '@nestjs/graphql';

export enum ProjetoCronogramaAgrupamento {
  NENHUM = 'NENHUM',
  TIPO = 'TIPO',
  STATUS = 'STATUS',
  RESPONSAVEL = 'RESPONSAVEL'
}

export enum ProjetoCronogramaElementoTipo {
  ITEM = 'ITEM',
  MARCO = 'MARCO',
  ENTREGA = 'ENTREGA'
}

export enum ProjetoCronogramaSeveridade {
  AVISO = 'AVISO',
  CRITICO = 'CRITICO'
}

registerEnumType(ProjetoCronogramaAgrupamento, {
  name: 'ProjetoCronogramaAgrupamento'
});
registerEnumType(ProjetoCronogramaElementoTipo, {
  name: 'ProjetoCronogramaElementoTipo'
});
registerEnumType(ProjetoCronogramaSeveridade, {
  name: 'ProjetoCronogramaSeveridade'
});

export type ProjetoCronogramaPermissoes = {
  podeVisualizar: boolean;
  podeGerenciarDependencias: boolean;
  podeEditarDatas: boolean;
};
