import { GrupoUsuarioCatalogService } from './grupo-usuario-catalog.service';

describe('GrupoUsuarioCatalogService session consistency', () => {
  const current = {
    id: 7,
    nome: 'Operadores',
    descricao: null,
    acessoEcommerce: true,
    acessoProjetos: false,
    acessoHoras: false,
    acessoConfigurador: false,
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: false,
    padraoSistema: false
  };

  function buildService(options: { revokeError?: Error } = {}) {
    const tx = {
      grupoUsuario: {
        update: jest.fn().mockResolvedValue({ ...current, acessoEcommerce: false })
      },
      usuario: {
        updateMany: options.revokeError
          ? jest.fn().mockRejectedValue(options.revokeError)
          : jest.fn().mockResolvedValue({ count: 2 })
      }
    };
    const prisma = {
      grupoUsuario: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn()
      },
      usuario: {
        updateMany: jest.fn()
      },
      $transaction: jest.fn(async (callback: (database: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const solucoes = {
      syncGroupAccess: jest.fn().mockResolvedValue(undefined),
      findGroupAccess: jest.fn().mockResolvedValue({
        solucaoIds: [],
        funcionalidadeIds: [],
        funcionalidadePermissoes: []
      })
    };
    const permissions = {
      resolveFuncionalidadePermissoes: jest.fn().mockReturnValue([])
    };
    const service = new GrupoUsuarioCatalogService(
      prisma as never,
      solucoes as never,
      permissions as never
    );

    return { service, prisma, solucoes, tx };
  }

  it('altera o grupo e revoga seus usuarios na mesma transacao', async () => {
    const { service, prisma, tx } = buildService();

    await service.update({ id: current.id, acessoEcommerce: false });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.grupoUsuario.update).toHaveBeenCalled();
    expect(tx.usuario.updateMany).toHaveBeenCalledWith({
      where: { grupoId: current.id },
      data: { sessaoVersao: { increment: 1 } }
    });
    expect(prisma.grupoUsuario.update).not.toHaveBeenCalled();
    expect(prisma.usuario.updateMany).not.toHaveBeenCalled();
  });

  it('inclui a sincronizacao de acessos na mesma transacao', async () => {
    const { service, solucoes, tx } = buildService();

    await service.update({ id: current.id, solucaoIds: [3] });

    expect(solucoes.syncGroupAccess).toHaveBeenCalledWith(
      current.id,
      [3],
      [],
      [],
      tx
    );
  });

  it('propaga falha de revogacao dentro da transacao sem concluir o update', async () => {
    const { service, prisma } = buildService({ revokeError: new Error('falha ao revogar') });

    await expect(service.update({ id: current.id, acessoEcommerce: false }))
      .rejects.toThrow('falha ao revogar');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
