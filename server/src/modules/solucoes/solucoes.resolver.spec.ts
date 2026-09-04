import { ForbiddenException } from '@nestjs/common';
import { SolucoesResolver } from './solucoes.resolver';

describe('SolucoesResolver', () => {
  const admin = { sub: 'admin', padraoSistema: true } as never;
  const input = { id: 1 } as never;
  const result = { id: 1 };
  const service = {
    myHubNavigation: jest.fn(), findAllAsAdmin: jest.fn(), createAsAdmin: jest.fn(), updateAsAdmin: jest.fn(),
    removeAsAdmin: jest.fn(), createFuncionalidadeAsAdmin: jest.fn(), updateFuncionalidadeAsAdmin: jest.fn(),
    removeFuncionalidadeAsAdmin: jest.fn()
  };
  const resolver = new SolucoesResolver(service as never);
  beforeEach(() => { jest.clearAllMocks(); Object.values(service).forEach((mock) => mock.mockReturnValue(result)); });

  it('mantém a navegação do Hub disponível ao usuário autenticado', () => {
    expect(resolver.myHubNavigation(admin)).toBe(result);
    expect(service.myHubNavigation).toHaveBeenCalledWith(admin);
  });

  it.each([
    ['createSolucao', 'createAsAdmin', input], ['updateSolucao', 'updateAsAdmin', input], ['deleteSolucao', 'removeAsAdmin', 1],
    ['createFuncionalidade', 'createFuncionalidadeAsAdmin', input], ['updateFuncionalidade', 'updateFuncionalidadeAsAdmin', input],
    ['deleteFuncionalidade', 'removeFuncionalidadeAsAdmin', 1]
  ] as const)('protege e delega %s', (method, target, value) => {
    expect((resolver[method] as never as (arg: never, actor: never) => unknown)(value as never, admin)).toBe(result);
    expect(service[target]).toHaveBeenCalledWith(value, admin);
    expect(() => (resolver[method] as never as (arg: never, actor: never) => unknown)(value as never, { padraoSistema: false } as never))
      .toThrow(ForbiddenException);
  });

  it('protege e lista o catálogo administrativo', () => {
    expect(resolver.solucoes(admin)).toBe(result);
    expect(service.findAllAsAdmin).toHaveBeenCalledWith(admin);
    expect(() => resolver.solucoes({ padraoSistema: false } as never)).toThrow(ForbiddenException);
  });
});
