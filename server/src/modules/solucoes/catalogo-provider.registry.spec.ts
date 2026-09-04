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
});
