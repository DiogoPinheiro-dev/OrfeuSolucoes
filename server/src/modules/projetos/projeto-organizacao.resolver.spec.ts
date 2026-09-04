import { ProjetoOrganizacaoResolver } from './projeto-organizacao.resolver';

describe('ProjetoOrganizacaoResolver', () => {
  const user = { sub: 'usuario-1' } as never; const input = { id: 'registro-1' } as never; const result = { id: 'resultado' };
  const service = { painel: jest.fn(), salvarCapacitacao: jest.fn(), excluirCapacitacao: jest.fn(), salvarEquipe: jest.fn(), excluirEquipe: jest.fn() };
  const resolver = new ProjetoOrganizacaoResolver(service as never);
  beforeEach(() => { jest.clearAllMocks(); Object.values(service).forEach((mock) => mock.mockReturnValue(result)); });

  it('consulta a organização da empresa atual', () => {
    expect(resolver.projetoOrganizacao(user)).toBe(result); expect(service.painel).toHaveBeenCalledWith(user);
  });

  it.each([
    ['salvarCapacitacao', 'salvarCapacitacao'], ['excluirCapacitacao', 'excluirCapacitacao'],
    ['salvarEquipe', 'salvarEquipe'], ['excluirEquipe', 'excluirEquipe']
  ] as const)('delega %s', (method, target) => {
    expect((resolver[method] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(service[target]).toHaveBeenCalledWith(input, user);
  });
});
