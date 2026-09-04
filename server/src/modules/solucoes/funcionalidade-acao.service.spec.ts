import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';

describe('FuncionalidadeAcaoService', () => {
  it('mantem como customizada uma acao conhecida quando as acoes padrao nao foram solicitadas', () => {
    const service = new FuncionalidadeAcaoService({} as never);

    expect(service.normalizeActionInputs([
      { chave: 'visualizar', nome: 'Visualizar customizacao' }
    ], false)).toEqual([
      expect.objectContaining({ chave: 'visualizar', acaoPadrao: false })
    ]);
  });

  it('cria permissoes ausentes sempre negadas por padrao', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      grupoFuncionalidade: { findMany: jest.fn().mockResolvedValue([{ grupoId: 2, podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true }]) },
      funcionalidadeAcao: { findMany: jest.fn().mockResolvedValue([{ id: 7, chave: 'visualizar' }]) },
      grupoFuncionalidadeAcao: { findMany: jest.fn().mockResolvedValue([]), createMany }
    };

    await new FuncionalidadeAcaoService(prisma as never).syncMissingActionPermissionsForFeature(10);

    expect(createMany).toHaveBeenCalledWith({ data: [{ grupoId: 2, funcionalidadeAcaoId: 7, permitido: false }] });
  });

  it('nao sobrescreve acao publicada durante sincronizacao de bootstrap', async () => {
    const update = jest.fn();
    const prisma = {
      funcionalidadeAcao: { findMany: jest.fn().mockResolvedValue([{ id: 7, chave: 'visualizar', configuracao: null, statusPublicacao: 'PUBLICADA' }]), update, upsert: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      grupoFuncionalidade: { findMany: jest.fn().mockResolvedValue([]) },
      grupoFuncionalidadeAcao: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() }
    };

    await new FuncionalidadeAcaoService(prisma as never).syncFuncionalidadeAcoes(10, [{ chave: 'visualizar', nome: 'Novo nome' }], { preserveAdditionalActions: true });
    expect(update).not.toHaveBeenCalled();
  });
});
