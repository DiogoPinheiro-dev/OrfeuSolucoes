import { ProjetosResolver } from './projetos.resolver';

describe('ProjetosResolver', () => {
  const user = { sub: 'usuario-1' } as never; const input = { id: 'registro-1' } as never; const result = { id: 'resultado' };
  const service = new Proxy({} as Record<string, jest.Mock>, { get: (target, key: string) => (target[key] ??= jest.fn().mockReturnValue(result)) });
  const resolver = new ProjetosResolver(service as never);
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['createProjeto', 'create'], ['updateProjeto', 'update'], ['updateProjetoEquipe', 'updateEquipe'],
    ['atualizarSituacaoProjeto', 'atualizarCiclo'], ['arquivarProjeto', 'arquivar'], ['reativarProjeto', 'reativar'],
    ['sugerirChaveProjeto', 'sugerirChave'], ['projeto', 'projeto'], ['createProjetoItem', 'createItem'],
    ['updateProjetoItem', 'updateItem'], ['alterarStatusProjetoItem', 'alterarStatusItem'], ['arquivarProjetoItem', 'arquivarItem'],
    ['reativarProjetoItem', 'reativarItem'], ['projetoItem', 'item'], ['projetoItemHistorico', 'itemHistorico'],
    ['projetoBacklogResponsaveis', 'backlogResponsaveis'], ['moverProjetoItemBacklog', 'moverItemBacklog']
  ] as const)('delega %s', (method, target) => {
    expect((resolver[method] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(service[target]).toHaveBeenCalledWith(input, user);
  });

  it('preserva a ordem específica de filtros e argumentos opcionais', () => {
    expect(resolver.projetos(user, input)).toBe(result); expect(service.projetos).toHaveBeenCalledWith(user, input);
    expect(resolver.projetoItens(input, user)).toBe(result); expect(service.itens).toHaveBeenCalledWith(user, input);
    expect(resolver.projetoParticipantesDisponiveis(user)).toBe(result); expect(service.participantesDisponiveis).toHaveBeenCalledWith(user);
    expect(resolver.projetoBacklogProjetos(user, true)).toBe(result); expect(service.backlogProjetos).toHaveBeenCalledWith(user, true);
    expect(resolver.projetoBacklogCandidatosPai('p1', user, 'i1')).toBe(result); expect(service.backlogCandidatosPai).toHaveBeenCalledWith('p1', user, 'i1');
  });
});
