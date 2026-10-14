import { CatalogoActionConsumerRegistry } from './catalogo-action-consumer.registry';

describe('CatalogoActionConsumerRegistry', () => {
  const registry = new CatalogoActionConsumerRegistry();

  it('reconhece as ações executáveis da gestão de horas sem publicar o catálogo', () => {
    expect(registry.isCompatible('aprovar_horas', 1)).toBe(true);
    expect(registry.isCompatible('reabrir_horas', 1)).toBe(true);
    expect(registry.isCompatible('fechar_periodo', 1)).toBe(true);
  });

  it('mantém a negação por padrão para uma ação sem consumidor', () => {
    expect(registry.find('acao_sem_consumidor')).toBeNull();
    expect(registry.isCompatible('acao_sem_consumidor', 1)).toBe(false);
  });
});
