import { ProjetoOrcamentoResolver } from './projeto-orcamento.resolver';

describe('ProjetoOrcamentoResolver', () => {
  const user = { sub: 'usuario-1', empresaId: 'empresa-1' } as never;
  const input = { projetoId: 'projeto-1' } as never;
  const result = { id: 'resultado-1' };
  const service = {
    orcamentoProjetos: jest.fn(), orcamento: jest.fn(), salvarOrcamento: jest.fn(),
    salvarOrcamentoCategoria: jest.fn(), salvarCusto: jest.fn(), excluirOrcamentoCategoria: jest.fn(),
    excluirCusto: jest.fn(), aprovarOrcamento: jest.fn(), reabrirOrcamento: jest.fn()
  };
  const resolver = new ProjetoOrcamentoResolver(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('lista apenas os projetos disponibilizados pelo serviço', () => {
    service.orcamentoProjetos.mockReturnValue(result);
    expect(resolver.projetoOrcamentoProjetos(user)).toBe(result);
    expect(service.orcamentoProjetos).toHaveBeenCalledWith(user);
  });

  it('consulta o orçamento pelo projeto', () => {
    service.orcamento.mockReturnValue(result);
    expect(resolver.projetoOrcamento('projeto-1', user)).toBe(result);
    expect(service.orcamento).toHaveBeenCalledWith('projeto-1', user);
  });

  it.each([
    ['salvarProjetoOrcamento', 'salvarOrcamento'], ['salvarProjetoOrcamentoCategoria', 'salvarOrcamentoCategoria'],
    ['salvarProjetoCusto', 'salvarCusto'], ['excluirProjetoOrcamentoCategoria', 'excluirOrcamentoCategoria'],
    ['excluirProjetoCusto', 'excluirCusto'], ['aprovarProjetoOrcamento', 'aprovarOrcamento'],
    ['reabrirProjetoOrcamento', 'reabrirOrcamento']
  ] as const)('delega %s ao serviço', (resolverMethod, serviceMethod) => {
    service[serviceMethod].mockReturnValue(result);
    expect((resolver[resolverMethod] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(service[serviceMethod]).toHaveBeenCalledWith(input, user);
  });
});
