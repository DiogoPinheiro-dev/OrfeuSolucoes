import { DEFAULT_CHAMADO_PRIORIDADES, DEFAULT_CHAMADO_TIPOS } from './constants/solucao.constants';
import { SolucaoChamadosBootstrapService } from './solucao-chamados-bootstrap.service';

describe('SolucaoChamadosBootstrapService configuracoes padrao', () => {
  function buildService(createTipo: jest.Mock, createPrioridade: jest.Mock) {
    const prisma = {
      chamadoTipo: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: createTipo
      },
      chamadoPrioridade: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: createPrioridade
      }
    };

    return new SolucaoChamadosBootstrapService(prisma as never, {} as never, {} as never, {} as never);
  }

  it('trata conflito de unicidade concorrente como configuracao ja criada', async () => {
    const createTipo = jest.fn().mockRejectedValue({ code: 'P2002' });
    const createPrioridade = jest.fn().mockRejectedValue({ code: 'P2002' });
    const service = buildService(createTipo, createPrioridade);

    await expect(service.ensureDefaultChamadoConfiguracoesForEmpresa(7, true)).resolves.toBeUndefined();

    expect(createTipo).toHaveBeenCalledTimes(DEFAULT_CHAMADO_TIPOS.length);
    expect(createPrioridade).toHaveBeenCalledTimes(DEFAULT_CHAMADO_PRIORIDADES.length);
  });

  it('propaga falhas de persistencia que nao sejam conflito de unicidade', async () => {
    const persistenceError = new Error('falha de conexao');
    const service = buildService(jest.fn().mockRejectedValue(persistenceError), jest.fn());

    await expect(service.ensureDefaultChamadoConfiguracoesForEmpresa(7, true)).rejects.toBe(persistenceError);
  });
});
describe('SolucaoChamadosBootstrapService providers de tela', () => {
  function buildCatalogService(
    existing: boolean,
    currentProvider: { key: string | null; version: number | null } = { key: null, version: null }
  ) {
    const featureIds = new Map<string, number>();
    const idFor = (slug: string) => {
      if (!featureIds.has(slug)) {
        featureIds.set(slug, featureIds.size + 10);
      }
      return featureIds.get(slug) as number;
    };
    const funcionalidade = {
      findUnique: jest.fn().mockImplementation(async (input: { where: { solucaoId_slug: { slug: string } } }) => {
        const slug = input.where.solucaoId_slug.slug;
        return existing
          ? {
              id: idFor(slug),
              solucaoId: 5,
              slug,
              providerKey: currentProvider.key,
              providerVersion: currentProvider.version
            }
          : null;
      }),
      update: jest.fn().mockImplementation(async (input: { where: { id: number }; data: Record<string, unknown> }) => ({
        id: input.where.id,
        ...input.data
      })),
      create: jest.fn().mockImplementation(async (input: { data: Record<string, unknown> }) => ({
        id: idFor(input.data.slug as string),
        ...input.data
      }))
    };
    const prisma = {
      solucao: {
        findUnique: jest.fn().mockResolvedValue({ id: 5 }),
        update: jest.fn().mockResolvedValue({ id: 5 }),
        create: jest.fn()
      },
      funcionalidade
    };
    const funcionalidadeAcaoService = {
      syncFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined)
    };
    const solucaoAcessoService = {
      syncNewFuncionalidadeAccess: jest.fn().mockResolvedValue(undefined)
    };
    const agrupamentos = {
      ensureAgrupamentoPadrao: jest.fn().mockResolvedValue(undefined)
    };

    return {
      service: new SolucaoChamadosBootstrapService(
        prisma as never,
        funcionalidadeAcaoService as never,
        solucaoAcessoService as never,
        agrupamentos as never
      ),
      funcionalidade,
      solucaoAcessoService
    };
  }

  it('repara providers ausentes das funcionalidades existentes', async () => {
    const { service, funcionalidade, solucaoAcessoService } = buildCatalogService(true);

    await service.ensureControleChamadosSolution();

    expect(funcionalidade.update).toHaveBeenCalledTimes(12);
    for (const [input] of funcionalidade.update.mock.calls) {
      expect(input.data.providerKey).toBe(input.data.registryKey);
      expect(input.data.providerVersion).toBe(1);
    }
    expect(solucaoAcessoService.syncNewFuncionalidadeAccess).not.toHaveBeenCalled();
  });

  it('cria funcionalidades novas com provider executavel', async () => {
    const { service, funcionalidade, solucaoAcessoService } = buildCatalogService(false);

    await service.ensureControleChamadosSolution();

    expect(funcionalidade.create).toHaveBeenCalledTimes(12);
    for (const [input] of funcionalidade.create.mock.calls) {
      expect(input.data.providerKey).toBe(input.data.registryKey);
      expect(input.data.providerVersion).toBe(1);
    }
    expect(solucaoAcessoService.syncNewFuncionalidadeAccess).toHaveBeenCalledTimes(12);
  });

  it('preserva providers existentes durante o bootstrap', async () => {
    const currentProvider = { key: 'controle-de-chamados.provider-customizado', version: 3 };
    const { service, funcionalidade } = buildCatalogService(true, currentProvider);

    await service.ensureControleChamadosSolution();

    for (const [input] of funcionalidade.update.mock.calls) {
      expect(input.data.providerKey).toBe(currentProvider.key);
      expect(input.data.providerVersion).toBe(currentProvider.version);
    }
  });
});
