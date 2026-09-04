import { ProjetosService } from './projetos.service';

describe('ProjetosService', () => {
  const user = { sub: 'usuario-1', empresaId: 7 } as never;
  const input = { id: 'registro-1' } as never;
  const result = { id: 'resultado-1' };
  const dependency = (): Record<string, jest.Mock> => new Proxy({}, {
    get: (target: Record<string, jest.Mock>, key: string) => (target[key] ??= jest.fn().mockReturnValue(result))
  });
  const authorization = { assertReadAccess: jest.fn().mockResolvedValue(7) };
  const catalog = dependency(); const equipe = dependency(); const lifecycle = dependency(); const key = dependency();
  const query = dependency(); const itemCatalog = dependency(); const itemQuery = dependency(); const backlog = dependency();
  const sprint = dependency(); const compromissos = dependency(); const cronograma = dependency(); const comunicacao = dependency();
  const recurso = dependency(); const orcamento = dependency();
  const service = new ProjetosService(
    authorization as never, catalog as never, equipe as never, lifecycle as never, key as never,
    query as never, itemCatalog as never, itemQuery as never, backlog as never, sprint as never,
    compromissos as never, cronograma as never, comunicacao as never, recurso as never, orcamento as never
  );

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['create', catalog, 'create'], ['update', catalog, 'update'], ['updateEquipe', equipe, 'updateEquipe'],
    ['atualizarCiclo', lifecycle, 'atualizarCiclo'], ['arquivar', lifecycle, 'arquivar'], ['reativar', lifecycle, 'reativar'],
    ['projeto', query, 'findOne'], ['createItem', itemCatalog, 'create'], ['updateItem', itemCatalog, 'update'],
    ['alterarStatusItem', itemCatalog, 'alterarStatus'], ['arquivarItem', itemCatalog, 'arquivar'], ['reativarItem', itemCatalog, 'reativar'],
    ['item', itemQuery, 'findOne'], ['itemHistorico', itemQuery, 'findHistorico'], ['moverItemBacklog', backlog, 'mover'],
    ['createSprint', sprint, 'create'], ['updateSprint', sprint, 'update'], ['adicionarItemSprint', sprint, 'adicionarItem'],
    ['removerItemSprint', sprint, 'removerItem'], ['iniciarSprint', sprint, 'iniciar'], ['concluirSprint', sprint, 'concluir'],
    ['cancelarSprint', sprint, 'cancelar'], ['createMarco', compromissos, 'createMarco'], ['updateMarco', compromissos, 'updateMarco'],
    ['createEntrega', compromissos, 'createEntrega'], ['updateEntrega', compromissos, 'updateEntrega'],
    ['createDependencia', cronograma, 'createDependencia'], ['updateCronogramaItemDatas', cronograma, 'updateItemDates'],
    ['createAtualizacao', comunicacao, 'createAtualizacao'], ['updateAtualizacao', comunicacao, 'updateAtualizacao'],
    ['createComentario', comunicacao, 'createComentario'], ['updateComentario', comunicacao, 'updateComentario'],
    ['excluirComentario', comunicacao, 'excluirComentario'], ['salvarRecurso', recurso, 'salvarRecurso'],
    ['excluirRecurso', recurso, 'excluirRecurso'], ['salvarOrcamento', orcamento, 'salvarOrcamento'],
    ['salvarOrcamentoCategoria', orcamento, 'salvarCategoria'], ['salvarCusto', orcamento, 'salvarCusto'],
    ['excluirOrcamentoCategoria', orcamento, 'excluirCategoria'], ['excluirCusto', orcamento, 'excluirCusto'],
    ['aprovarOrcamento', orcamento, 'aprovar'], ['reabrirOrcamento', orcamento, 'reabrir']
  ] as const)('mantém a delegação de %s', (method, target, targetMethod) => {
    expect((service[method] as never as (value: never, actor: never) => unknown)(input, user)).toBe(result);
    expect(target[targetMethod]).toHaveBeenCalledWith(input, user);
  });

  it.each([
    ['projetos', query, 'findPage'], ['itens', itemQuery, 'findPage']
  ] as const)('encaminha filtro e usuário em %s', (method, target, targetMethod) => {
    expect((service[method] as never as (actor: never, filter: never) => unknown)(user, input)).toBe(result);
    expect(target[targetMethod]).toHaveBeenCalledWith(user, input);
  });

  it.each([
    ['participantesDisponiveis', query, 'participantesDisponiveis'], ['comunicacaoProjetos', comunicacao, 'projetos'],
    ['recursosProjetos', recurso, 'projetos'], ['recursos', recurso, 'painel'], ['orcamentoProjetos', orcamento, 'projetos']
  ] as const)('encaminha o usuário em %s', (method, target, targetMethod) => {
    expect((service[method] as never as (actor: never) => unknown)(user)).toBe(result);
    expect(target[targetMethod]).toHaveBeenCalledWith(user);
  });

  it('sugere a chave somente após resolver a empresa autorizada', async () => {
    await expect(service.sugerirChave('Novo projeto', user)).resolves.toBe(result as never);
    expect(authorization.assertReadAccess).toHaveBeenCalledWith(user);
    expect(key.sugerir).toHaveBeenCalledWith('Novo projeto', 7);
  });

  it('mantém os argumentos especializados dos painéis e operações', () => {
    expect(service.backlogProjetos(user, true)).toBe(result); expect(backlog.projetos).toHaveBeenCalledWith(user, true);
    expect(service.backlogResponsaveis('p1', user)).toBe(result); expect(backlog.responsaveis).toHaveBeenCalledWith('p1', user);
    expect(service.backlogCandidatosPai('p1', user, 'i1')).toBe(result); expect(backlog.candidatosPai).toHaveBeenCalledWith('p1', user, 'i1');
    expect(service.sprints('p1', user)).toBe(result); expect(sprint.painel).toHaveBeenCalledWith('p1', user);
    expect(service.marcosEntregas('p1', true, user)).toBe(result); expect(compromissos.painel).toHaveBeenCalledWith('p1', true, user);
    expect(service.arquivarCompromisso('MARCO', input, user, true)).toBe(result); expect(compromissos.archive).toHaveBeenCalledWith('MARCO', input, user, true);
    expect(service.cronograma(input, user)).toBe(result); expect(cronograma.painel).toHaveBeenCalledWith(input, user);
    expect(service.archiveDependencia(input, user, true)).toBe(result); expect(cronograma.archiveDependencia).toHaveBeenCalledWith(input, user, true);
    expect(service.comunicacao('p1', user, input)).toBe(result); expect(comunicacao.painel).toHaveBeenCalledWith('p1', user, input);
    expect(service.orcamento('p1', user)).toBe(result); expect(orcamento.painel).toHaveBeenCalledWith('p1', user);
  });
});
