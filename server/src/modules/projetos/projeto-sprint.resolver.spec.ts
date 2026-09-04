import { ProjetoSprintResolver } from './projeto-sprint.resolver';

describe('ProjetoSprintResolver', () => {
  const user = { sub: 'usuario-1', empresaId: 'empresa-1' } as never;
  const input = { id: 'sprint-1' } as never;
  const result = { id: 'resultado-1' };
  const service = {
    sprints: jest.fn(), createSprint: jest.fn(), updateSprint: jest.fn(),
    adicionarItemSprint: jest.fn(), removerItemSprint: jest.fn(), iniciarSprint: jest.fn(),
    concluirSprint: jest.fn(), cancelarSprint: jest.fn()
  };
  const resolver = new ProjetoSprintResolver(service as never);

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['createProjetoSprint', 'createSprint'], ['updateProjetoSprint', 'updateSprint'],
    ['adicionarItemProjetoSprint', 'adicionarItemSprint'], ['removerItemProjetoSprint', 'removerItemSprint'],
    ['iniciarProjetoSprint', 'iniciarSprint'], ['concluirProjetoSprint', 'concluirSprint'],
    ['cancelarProjetoSprint', 'cancelarSprint']
  ] as const)('delega %s ao serviço', (resolverMethod, serviceMethod) => {
    service[serviceMethod].mockReturnValue(result);
    expect((resolver[resolverMethod] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(service[serviceMethod]).toHaveBeenCalledWith(input, user);
  });

  it('consulta o painel de sprints do projeto', () => {
    service.sprints.mockReturnValue(result);
    expect(resolver.projetoSprints('projeto-1', user)).toBe(result);
    expect(service.sprints).toHaveBeenCalledWith('projeto-1', user);
  });
});
