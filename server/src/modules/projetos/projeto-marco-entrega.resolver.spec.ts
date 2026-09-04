import { ProjetoMarcoEntregaResolver } from './projeto-marco-entrega.resolver';

describe('ProjetoMarcoEntregaResolver', () => {
  const user = { sub: 'usuario-1', empresaId: 'empresa-1' } as never;
  const input = { id: 'compromisso-1' } as never;
  const result = { id: 'resultado-1' };
  const service = {
    marcosEntregas: jest.fn(), createMarco: jest.fn(), updateMarco: jest.fn(),
    createEntrega: jest.fn(), updateEntrega: jest.fn(), arquivarCompromisso: jest.fn()
  };
  const resolver = new ProjetoMarcoEntregaResolver(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('consulta o painel com a opção de arquivados', () => {
    service.marcosEntregas.mockReturnValue(result);
    expect(resolver.projetoMarcosEntregas('projeto-1', true, user)).toBe(result);
    expect(service.marcosEntregas).toHaveBeenCalledWith('projeto-1', true, user);
  });

  it.each([
    ['createProjetoMarco', 'createMarco'], ['updateProjetoMarco', 'updateMarco'],
    ['createProjetoEntrega', 'createEntrega'], ['updateProjetoEntrega', 'updateEntrega']
  ] as const)('delega %s ao serviço', (resolverMethod, serviceMethod) => {
    service[serviceMethod].mockReturnValue(result);
    expect((resolver[resolverMethod] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(service[serviceMethod]).toHaveBeenCalledWith(input, user);
  });

  it.each([
    ['arquivarProjetoMarco', 'MARCO', false], ['reativarProjetoMarco', 'MARCO', true],
    ['arquivarProjetoEntrega', 'ENTREGA', false], ['reativarProjetoEntrega', 'ENTREGA', true]
  ] as const)('aplica a transição correta em %s', (resolverMethod, tipo, reativar) => {
    service.arquivarCompromisso.mockReturnValue(result);
    expect((resolver[resolverMethod] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(service.arquivarCompromisso).toHaveBeenCalledWith(tipo, input, user, reativar);
  });
});
