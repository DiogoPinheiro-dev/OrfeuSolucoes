import { ProdutoAtualizacaoService } from './produto-atualizacao.service';

function criarCenario(origem = 'BANCO_EXISTENTE') {
  const registros: Array<{ id: string; modo: string }> = [];
  const transacao = {
    produtoAtualizacao: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        registros.find((item) => item.id === where.id) ?? null),
      create: jest.fn(async ({ data }: { data: { id: string; modo: string } }) => {
        const registro = { id: data.id, modo: data.modo };
        registros.push(registro);
        return registro;
      })
    }
  };
  const prisma = {
    sistemaInstalacao: { findUnique: jest.fn().mockResolvedValue({ id: 1, origem }) },
    produtoAtualizacao: {
      findMany: jest.fn(async () => registros.map(({ id }) => ({ id }))),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        registros.find((item) => item.id === where.id) ?? null)
    },
    $transaction: jest.fn(async (operacao: (database: typeof transacao) => Promise<unknown>) => {
      const antes = [...registros];
      try {
        return await operacao(transacao);
      } catch (error) {
        registros.splice(0, registros.length, ...antes);
        throw error;
      }
    })
  };
  const catalogo = {
    convergirManifesto: jest.fn().mockResolvedValue({ funcionalidadesCriadas: 1 })
  };
  const service = new ProdutoAtualizacaoService(prisma as never, catalogo as never);
  return { service, prisma, transacao, catalogo, registros };
}

describe('ProdutoAtualizacaoService', () => {
  it('aplica uma atualizacao pendente uma unica vez e registra o resumo na mesma transacao', async () => {
    const { service, prisma, transacao, catalogo, registros } = criarCenario();

    await expect(service.aplicarPendentes()).resolves.toEqual({
      aplicadas: ['0001-convergencia-catalogo-2026-10-15'],
      incorporadas: []
    });
    await expect(service.aplicarPendentes()).resolves.toEqual({ aplicadas: [], incorporadas: [] });

    expect(catalogo.convergirManifesto).toHaveBeenCalledTimes(1);
    expect(transacao.produtoAtualizacao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: '0001-convergencia-catalogo-2026-10-15',
        modo: 'APLICADA',
        resumo: JSON.stringify({ funcionalidadesCriadas: 1 })
      })
    });
    expect(registros).toEqual([{ id: '0001-convergencia-catalogo-2026-10-15', modo: 'APLICADA' }]);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'Serializable', timeout: 120_000 })
    );
  });

  it('reverte o passo e nao grava o registro quando a atualizacao falha', async () => {
    const { service, catalogo, registros, transacao } = criarCenario();
    catalogo.convergirManifesto.mockRejectedValueOnce(new Error('falha no catalogo'));

    await expect(service.aplicarPendentes()).rejects.toThrow('falha no catalogo');

    expect(registros).toEqual([]);
    expect(transacao.produtoAtualizacao.create).not.toHaveBeenCalled();
  });

  it('marca a atualizacao como incorporada quando a instalacao nova perdeu apenas o registro', async () => {
    const { service, catalogo, registros } = criarCenario('INSTALACAO');

    await expect(service.aplicarPendentes()).resolves.toEqual({
      aplicadas: [],
      incorporadas: ['0001-convergencia-catalogo-2026-10-15']
    });

    expect(catalogo.convergirManifesto).not.toHaveBeenCalled();
    expect(registros).toEqual([{
      id: '0001-convergencia-catalogo-2026-10-15',
      modo: 'INCORPORADA_NA_INSTALACAO'
    }]);
  });

  it('recusa banco sem marca de instalacao', async () => {
    const { service, prisma } = criarCenario();
    prisma.sistemaInstalacao.findUnique.mockResolvedValueOnce(null);

    await expect(service.aplicarPendentes()).rejects.toThrow('banco:transicao');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('nao confunde uma violacao unica interna com concorrencia no registro da atualizacao', async () => {
    const { service, prisma } = criarCenario();
    prisma.$transaction.mockRejectedValueOnce(Object.assign(new Error('duplicidade interna'), { code: 'P2002' }));

    await expect(service.aplicarPendentes()).rejects.toThrow('duplicidade interna');
  });
});
