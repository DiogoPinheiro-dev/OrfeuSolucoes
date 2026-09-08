import { CatalogoProviderRegistry } from './catalogo-provider.registry';

describe('CatalogoProviderRegistry', () => {
  it('expõe providers únicos, versionados e ordenados para o editor administrativo', () => {
    const providers = new CatalogoProviderRegistry().list();

    expect(providers.length).toBeGreaterThan(0);
    expect(new Set(providers.map((provider) => provider.key)).size).toBe(providers.length);
    expect(providers).toEqual([...providers].sort((left, right) => left.key.localeCompare(right.key)));
    expect(providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'projetos.backlog-de-demandas', version: 1 })
    ]));
  });

  it('preserva aliases históricos sem duplicá-los na lista administrativa', () => {
    const registry = new CatalogoProviderRegistry();

    expect(registry.find('projetos.recursos-do-projeto')).toMatchObject({
      key: 'projetos.planejamento-de-recursos',
      version: 1
    });
    expect(registry.find('projetos.grade-de-capacitacao')).toMatchObject({
      key: 'projetos.planejamento-de-recursos',
      version: 1
    });
    expect(registry.list().map((provider) => provider.key)).not.toContain('projetos.recursos-do-projeto');
  });
});
