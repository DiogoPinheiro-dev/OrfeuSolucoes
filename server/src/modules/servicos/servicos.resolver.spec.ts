import { ServicosResolver } from './servicos.resolver';

describe('ServicosResolver', () => {
  const user = { sub: 'admin', padraoSistema: true } as never;
  const input = { id: 1 } as never;
  const result = { id: 1 };
  const service = { createAsAdmin: jest.fn(), findAllAsAdmin: jest.fn(), updateAsAdmin: jest.fn(), removeAsAdmin: jest.fn() };
  const resolver = new ServicosResolver(service as never);
  beforeEach(() => { jest.clearAllMocks(); Object.values(service).forEach((mock) => mock.mockReturnValue(result)); });

  it.each([
    ['createServico', 'createAsAdmin', input], ['updateServico', 'updateAsAdmin', input], ['deleteServico', 'removeAsAdmin', 1]
  ] as const)('delega %s com o usuário atual', (method, target, value) => {
    expect((resolver[method] as never as (arg: never, actor: never) => unknown)(value as never, user)).toBe(result);
    expect(service[target]).toHaveBeenCalledWith(value, user);
  });

  it('lista os serviços como administrador', () => {
    expect(resolver.servicos(user)).toBe(result);
    expect(service.findAllAsAdmin).toHaveBeenCalledWith(user);
  });
});
