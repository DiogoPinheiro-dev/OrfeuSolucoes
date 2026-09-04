import { Injectable } from '@nestjs/common';

export type CatalogoActionConsumer = { key: string; version: number };

const ACTION_CONSUMER_KEYS = [
  'visualizar', 'incluir', 'alterar', 'excluir',
  'gerenciar_membros', 'alterar_status', 'reativar_projeto', 'priorizar', 'planejar',
  'iniciar', 'concluir', 'cancelar', 'aprovar', 'editar_datas', 'comentar', 'moderar',
  'gerenciar_anexos', 'visualizar_financeiro', 'gerenciar_financeiro', 'aprovar_orcamento',
  'apontar', 'aprovar_horas', 'reabrir_horas', 'publicar', 'instanciar',
  'responder_proprio_chamado', 'reabrir_proprio_chamado', 'visualizar_fila',
  'assumir_chamado', 'atribuir_chamado', 'transferir_chamado', 'responder_chamado',
  'adicionar_nota_interna', 'alterar_prioridade', 'alterar_categoria', 'resolver_chamado',
  'encerrar_chamado', 'reabrir_chamado'
] as const;

@Injectable()
export class CatalogoActionConsumerRegistry {
  private readonly consumers = new Map<string, CatalogoActionConsumer>(
    ACTION_CONSUMER_KEYS.map((key) => [key, { key, version: 1 }])
  );

  find(key?: string | null): CatalogoActionConsumer | null {
    return key ? this.consumers.get(key) ?? null : null;
  }

  isCompatible(key?: string | null, requiredVersion?: number | null): boolean {
    const consumer = this.find(key);
    return !!consumer && consumer.version >= (requiredVersion ?? 1);
  }
}
