import { ForbiddenException } from '@nestjs/common';
import { CatalogoResolver } from './catalogo.resolver';

describe('CatalogoResolver', () => {
  const admin = { sub: 'admin-1', padraoSistema: true } as never;
  const result = { id: 'versao-1' };
  const lifecycle = {
    findFeatureDraft: jest.fn(), findActionDraft: jest.fn(),
    createSolutionDraft: jest.fn(), updateSolutionDraft: jest.fn(), publishSolutionDraft: jest.fn(),
    unpublishSolution: jest.fn(), restoreSolutionVersion: jest.fn(), restoreSolutionBaseline: jest.fn(),
    createFeatureDraft: jest.fn(), validateFeatureDraft: jest.fn(), updateFeatureDraft: jest.fn(),
    publishFeatureDraft: jest.fn(), unpublishFeature: jest.fn(), restoreFeatureVersion: jest.fn(),
    restoreFeatureBaseline: jest.fn(), createActionDraft: jest.fn(), validateActionDraft: jest.fn(),
    updateActionDraft: jest.fn(), publishActionDraft: jest.fn(), unpublishAction: jest.fn(),
    restoreActionVersion: jest.fn(), restoreActionBaseline: jest.fn()
  };
  const providers = { list: jest.fn() };
  const resolver = new CatalogoResolver(lifecycle as never, providers as never);

  beforeEach(() => {
    jest.clearAllMocks();
    for (const mock of Object.values(lifecycle)) mock.mockReturnValue(result);
  });

  it('protege o catálogo contra usuários que não são administradores do sistema', () => {
    expect(() => resolver.catalogoProviders({ sub: 'comum', padraoSistema: false } as never))
      .toThrow(ForbiddenException);
    expect(providers.list).not.toHaveBeenCalled();
  });

  it('lista os provedores registrados para o administrador', () => {
    providers.list.mockReturnValue([result]);
    expect(resolver.catalogoProviders(admin)).toEqual([result]);
    expect(providers.list).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['catalogoRascunhoFuncionalidade', 'findFeatureDraft', [11], [11]],
    ['catalogoRascunhoAcao', 'findActionDraft', [12], [12]],
    ['criarRascunhoSolucao', 'createSolutionDraft', [1, 'motivo'], [1, 'admin-1', 'motivo']],
    ['salvarRascunhoSolucao', 'updateSolutionDraft', [{ id: 'v1' }], [{ id: 'v1' }, 'admin-1']],
    ['publicarRascunhoSolucao', 'publishSolutionDraft', ['v1', 2, 'motivo'], ['v1', 2, 'admin-1', 'motivo']],
    ['restaurarVersaoSolucao', 'restoreSolutionVersion', ['v1', 'motivo'], ['v1', 'admin-1', 'motivo']],
    ['restaurarPadraoSolucao', 'restoreSolutionBaseline', [1, 'motivo'], [1, 'admin-1', 'motivo']],
    ['criarRascunhoFuncionalidade', 'createFeatureDraft', [2, undefined], [2, 'admin-1', undefined]],
    ['validarRascunhoFuncionalidade', 'validateFeatureDraft', ['v2'], ['v2']],
    ['salvarRascunhoFuncionalidade', 'updateFeatureDraft', [{ id: 'v2' }], [{ id: 'v2' }, 'admin-1']],
    ['publicarRascunhoFuncionalidade', 'publishFeatureDraft', ['v2', 3, undefined], ['v2', 3, 'admin-1', undefined]],
    ['restaurarVersaoFuncionalidade', 'restoreFeatureVersion', ['v2', 'motivo'], ['v2', 'admin-1', 'motivo']],
    ['restaurarPadraoFuncionalidade', 'restoreFeatureBaseline', [2, 'motivo'], [2, 'admin-1', 'motivo']],
    ['criarRascunhoAcao', 'createActionDraft', [3, 'motivo'], [3, 'admin-1', 'motivo']],
    ['validarRascunhoAcao', 'validateActionDraft', ['v3'], ['v3']],
    ['salvarRascunhoAcao', 'updateActionDraft', [{ id: 'v3' }], [{ id: 'v3' }, 'admin-1']],
    ['publicarRascunhoAcao', 'publishActionDraft', ['v3', 4, 'motivo'], ['v3', 4, 'admin-1', 'motivo']],
    ['restaurarVersaoAcao', 'restoreActionVersion', ['v3', 'motivo'], ['v3', 'admin-1', 'motivo']],
    ['restaurarPadraoAcao', 'restoreActionBaseline', [3, 'motivo'], [3, 'admin-1', 'motivo']]
  ] as const)('autoriza e delega %s', (resolverMethod, serviceMethod, args, expectedArgs) => {
    const actual = (resolver[resolverMethod] as never as (...values: unknown[]) => unknown)(...args, admin);
    expect(actual).toBe(result);
    expect(lifecycle[serviceMethod]).toHaveBeenCalledWith(...expectedArgs);
  });

  it.each([
    ['despublicarSolucao', 'unpublishSolution', 1],
    ['despublicarFuncionalidade', 'unpublishFeature', 2],
    ['despublicarAcao', 'unpublishAction', 3]
  ] as const)('aguarda a despublicação em %s e retorna verdadeiro', async (resolverMethod, serviceMethod, id) => {
    lifecycle[serviceMethod].mockResolvedValue(undefined);
    await expect((resolver[resolverMethod] as never as (value: number, reason: string, actor: never) => Promise<boolean>)(id, 'motivo', admin))
      .resolves.toBe(true);
    expect(lifecycle[serviceMethod]).toHaveBeenCalledWith(id, 'admin-1', 'motivo');
  });
});
