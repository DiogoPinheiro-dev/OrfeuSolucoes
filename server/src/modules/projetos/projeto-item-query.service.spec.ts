import { ProjetoItemQueryService } from './projeto-item-query.service';

jest.mock('./mappers/projeto-item.mapper', () => ({
  toProjetoItemType: (item: { id: string }) => ({ id: item.id })
}));

const user = { sub: 'usuario-1' } as never;
const contexto = { empresaId: 7, projeto: { id: 'projeto-1', backlogVersao: 3 } } as never;

function build(findMany: jest.Mock) {
  const prisma = { projetoItem: { findMany, count: jest.fn().mockResolvedValue(7) } };
  const authorization = {
    assertReadContext: jest.fn().mockResolvedValue(contexto),
    escopoHierarquico: jest.fn().mockResolvedValue({ restrito: false }),
    filtroVisibilidade: jest.fn().mockReturnValue({}),
    effectivePermissions: jest.fn().mockResolvedValue({ podeVisualizar: true })
  };
  const periodo = { normalizePaginacao: (pagina: number, limite: number) => ({ pagina, limite }) };
  return { prisma, service: new ProjetoItemQueryService(prisma as never, authorization as never, periodo as never) };
}

describe('ProjetoItemQueryService agrupamento do backlog', () => {
  const chave = (id: string, status: string) => ({ id, status, tipo: 'TAREFA', prioridade: 'MEDIA' });
  const backlog = [
    chave('i1', 'CONCLUIDO'),
    chave('i2', 'ABERTO'),
    chave('i3', 'EM_ANDAMENTO'),
    chave('i4', 'ABERTO'),
    chave('i5', 'ABERTO'),
    chave('i6', 'ABERTO'),
    chave('i7', 'ABERTO')
  ];

  it('agrupa o backlog filtrado inteiro antes de paginar e informa os totais de cada grupo', async () => {
    const findMany = jest.fn()
      .mockResolvedValueOnce(backlog)
      .mockImplementationOnce(({ where }) => Promise.resolve([...where.id.in].reverse().map((id: string) => ({ id }))));
    const { prisma, service } = build(findMany);

    const page = await service.findPage(user, { projetoId: 'projeto-1', pagina: 2, limite: 5, agruparPor: 'STATUS' } as never);

    expect(page.items.map((item) => item.id)).toEqual(['i3', 'i1']);
    expect(page).toMatchObject({ total: 7, pagina: 2, limite: 5, totalPaginas: 2 });
    expect(page.grupos).toEqual([
      { valor: 'ABERTO', total: 5 },
      { valor: 'EM_ANDAMENTO', total: 1 },
      { valor: 'CONCLUIDO', total: 1 }
    ]);
    expect(prisma.projetoItem.count).not.toHaveBeenCalled();
    expect(findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ empresaId: 7, projetoId: 'projeto-1', id: { in: ['i3', 'i1'] } })
    }));
  });

  it('mantem a paginacao pela ordem do backlog quando nao ha agrupamento', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'i1' }]);
    const { prisma, service } = build(findMany);

    const page = await service.findPage(user, { projetoId: 'projeto-1', pagina: 1, limite: 5 } as never);

    expect(page.grupos).toEqual([]);
    expect(prisma.projetoItem.count).toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 5 }));
  });
});
