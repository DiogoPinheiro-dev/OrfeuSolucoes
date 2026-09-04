import { CatalogoProviderRegistry } from './catalogo-provider.registry';
import { CatalogoValidationService } from './catalogo-validation.service';

describe('CatalogoValidationService', () => {
  const service = new CatalogoValidationService(new CatalogoProviderRegistry());

  it('aceita funcionalidade apoiada por provider de codigo compativel', () => {
    expect(service.validateFuncionalidade({
      chaveTecnica: 'projetos.backlog-de-demandas',
      providerKey: 'projetos.backlog-de-demandas',
      providerVersion: 1
    })).toEqual([]);
  });

  it('impede publicacao sem provider, com provider desconhecido ou conflito', () => {
    expect(service.validateFuncionalidade({ chaveTecnica: 'custom.feature' })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'PROVIDER_REQUIRED', severity: 'ERROR' })
    ]));
    expect(service.validateFuncionalidade({ chaveTecnica: 'custom.feature', providerKey: 'custom.missing', pendingConflicts: 1 })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'PROVIDER_INCOMPATIBLE', severity: 'ERROR' }),
      expect.objectContaining({ code: 'CONFLICTS_PENDING', severity: 'ERROR' })
    ]));
  });
});
