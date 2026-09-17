import { SolucaoAcessoService } from './solucao-acesso.service';

describe('SolucaoAcessoService', () => {
  it('preserva os defaults explicitos do grupo ao instalar funcionalidade de produto', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      grupoSolucao: { findMany: jest.fn().mockResolvedValue([{ grupoId: 2, grupo: { podeVisualizar: true } }]) },
      grupoFuncionalidade: { createMany },
      empresaSolucao: { findMany: jest.fn().mockResolvedValue([]) },
      empresaFuncionalidade: { createMany: jest.fn() }
    };
    const actions = { syncMissingActionPermissionsForFeature: jest.fn().mockResolvedValue(undefined) };
    const service = new SolucaoAcessoService(prisma as never, actions as never);

    await service.syncNewFuncionalidadeAccess({ id: 10, solucaoId: 1 } as never);

    expect(createMany).toHaveBeenCalledWith({ data: [{ grupoId: 2, funcionalidadeId: 10, podeVisualizar: true, podeIncluir: false, podeAlterar: false, podeExcluir: false }] });
    expect(actions.syncMissingActionPermissionsForFeature).toHaveBeenCalledWith(10, true);
  });

  it('copia para a funcionalidade nova somente o acesso existente na origem', async () => {
    const db = {
      grupoFuncionalidade: {
        findMany: jest.fn().mockResolvedValue([{ grupoId: 3, funcionalidadeId: 27, podeVisualizar: true, podeIncluir: true, podeAlterar: false, podeExcluir: false }]),
        createMany: jest.fn()
      },
      empresaFuncionalidade: { findMany: jest.fn().mockResolvedValue([{ empresaId: 5 }]), createMany: jest.fn() },
      chamadoResponsavelFuncionalidade: { findMany: jest.fn().mockResolvedValue([{ responsavelSolucaoId: 9, ativo: true }]), createMany: jest.fn() },
      funcionalidadeAcao: {
        findMany: jest.fn()
          .mockResolvedValueOnce([{ id: 101, chave: 'incluir' }, { id: 102, chave: 'priorizar' }])
          .mockResolvedValueOnce([{ id: 201, chave: 'incluir' }])
      },
      grupoFuncionalidadeAcao: {
        findMany: jest.fn().mockResolvedValue([
          { grupoId: 3, funcionalidadeAcaoId: 101, permitido: true },
          { grupoId: 3, funcionalidadeAcaoId: 102, permitido: true }
        ]),
        createMany: jest.fn()
      }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const actions = { syncMissingActionPermissionsForFeature: jest.fn().mockResolvedValue(undefined) };
    const service = new SolucaoAcessoService(prisma as never, actions as never);

    await service.copyFuncionalidadeAccess(27, { id: 40, solucaoId: 1 } as never);

    expect(db.grupoFuncionalidade.createMany).toHaveBeenCalledWith({
      data: [{ grupoId: 3, funcionalidadeId: 40, podeVisualizar: true, podeIncluir: true, podeAlterar: false, podeExcluir: false }]
    });
    expect(db.grupoFuncionalidadeAcao.createMany).toHaveBeenCalledWith({ data: [{ grupoId: 3, funcionalidadeAcaoId: 201, permitido: true }] });
    expect(db.empresaFuncionalidade.createMany).toHaveBeenCalledWith({ data: [{ empresaId: 5, funcionalidadeId: 40 }] });
    expect(db.chamadoResponsavelFuncionalidade.createMany).toHaveBeenCalledWith({
      data: [{ responsavelSolucaoId: 9, funcionalidadeId: 40, ativo: true }]
    });
    expect(actions.syncMissingActionPermissionsForFeature).toHaveBeenCalledWith(40, true);
  });

  it('não concede acesso algum quando a origem não possui grupos, empresas ou responsáveis', async () => {
    const db = {
      grupoFuncionalidade: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
      empresaFuncionalidade: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
      chamadoResponsavelFuncionalidade: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
      funcionalidadeAcao: { findMany: jest.fn().mockResolvedValue([]) },
      grupoFuncionalidadeAcao: { findMany: jest.fn(), createMany: jest.fn() }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const actions = { syncMissingActionPermissionsForFeature: jest.fn().mockResolvedValue(undefined) };
    const service = new SolucaoAcessoService(prisma as never, actions as never);

    await service.copyFuncionalidadeAccess(27, { id: 40, solucaoId: 1 } as never);

    expect(db.grupoFuncionalidade.createMany).not.toHaveBeenCalled();
    expect(db.empresaFuncionalidade.createMany).not.toHaveBeenCalled();
    expect(db.chamadoResponsavelFuncionalidade.createMany).not.toHaveBeenCalled();
    expect(db.grupoFuncionalidadeAcao.createMany).not.toHaveBeenCalled();
  });
});
