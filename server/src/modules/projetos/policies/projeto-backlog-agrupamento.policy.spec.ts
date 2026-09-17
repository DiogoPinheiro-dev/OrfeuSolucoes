import { contarGrupos, ordenarPorAgrupamento, ProjetoBacklogAgrupamento } from './projeto-backlog-agrupamento.policy';

const item = (id: string, status: string, tipo = 'TAREFA', prioridade = 'MEDIA') => ({ id, status, tipo, prioridade });

describe('projeto-backlog-agrupamento.policy', () => {
  const backlog = [
    item('1', 'CONCLUIDO', 'BUG', 'BAIXA'),
    item('2', 'ABERTO', 'TAREFA', 'CRITICA'),
    item('3', 'EM_ANDAMENTO', 'HISTORIA', 'ALTA'),
    item('4', 'ABERTO', 'BUG', 'CRITICA'),
    item('5', 'CANCELADO', 'MELHORIA', 'MEDIA'),
    item('6', 'ABERTO', 'TAREFA', 'BAIXA')
  ];

  it('agrupa por status no fluxo de trabalho e preserva a ordem do backlog dentro do grupo', () => {
    const ordenados = ordenarPorAgrupamento(backlog, ProjetoBacklogAgrupamento.STATUS);

    expect(ordenados.map((entry) => entry.id)).toEqual(['2', '4', '6', '3', '1', '5']);
    expect(contarGrupos(ordenados, ProjetoBacklogAgrupamento.STATUS)).toEqual([
      { valor: 'ABERTO', total: 3 },
      { valor: 'EM_ANDAMENTO', total: 1 },
      { valor: 'CONCLUIDO', total: 1 },
      { valor: 'CANCELADO', total: 1 }
    ]);
  });

  it('agrupa por prioridade da mais urgente para a menos urgente', () => {
    const ordenados = ordenarPorAgrupamento(backlog, ProjetoBacklogAgrupamento.PRIORIDADE);

    expect(ordenados.map((entry) => entry.prioridade)).toEqual(['CRITICA', 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA', 'BAIXA']);
    expect(ordenados.slice(0, 2).map((entry) => entry.id)).toEqual(['2', '4']);
  });

  it('agrupa por tipo e envia valores desconhecidos ao final', () => {
    const ordenados = ordenarPorAgrupamento([...backlog, item('7', 'ABERTO', 'OUTRO')], ProjetoBacklogAgrupamento.TIPO);

    expect(ordenados.map((entry) => entry.tipo)).toEqual(['HISTORIA', 'TAREFA', 'TAREFA', 'BUG', 'BUG', 'MELHORIA', 'OUTRO']);
    const grupos = contarGrupos(ordenados, ProjetoBacklogAgrupamento.TIPO);
    expect(grupos[grupos.length - 1]).toEqual({ valor: 'OUTRO', total: 1 });
  });

  it('nao altera a lista recebida', () => {
    const original = backlog.map((entry) => entry.id);
    ordenarPorAgrupamento(backlog, ProjetoBacklogAgrupamento.STATUS);
    expect(backlog.map((entry) => entry.id)).toEqual(original);
  });
});
