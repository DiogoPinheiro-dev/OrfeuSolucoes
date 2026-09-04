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
});
