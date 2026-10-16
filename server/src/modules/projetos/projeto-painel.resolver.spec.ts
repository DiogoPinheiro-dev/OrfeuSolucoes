import { ProjetoPainelResolver } from './projeto-painel.resolver';

describe('ProjetoPainelResolver', () => {
  it('delega a consulta somente-leitura ao servico de painel', () => {
    const resultado = { projetoId: 'projeto-1' };
    const service = { painel: jest.fn().mockReturnValue(resultado) };
    const resolver = new ProjetoPainelResolver(service as never);
    const user = { sub: 'usuario-1', empresaId: 7 } as never;

    expect(resolver.projetoPainel('projeto-1', user)).toBe(resultado);
    expect(service.painel).toHaveBeenCalledWith('projeto-1', user);
  });
});
