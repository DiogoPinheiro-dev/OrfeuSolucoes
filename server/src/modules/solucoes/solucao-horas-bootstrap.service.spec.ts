import { SolucaoHorasBootstrapService } from './solucao-horas-bootstrap.service';

describe('SolucaoHorasBootstrapService', () => {
  const featureIds = new Map([
    ['registro-de-horas', 101],
    ['aprovacao-de-apontamentos', 102],
    ['relatorios-de-horas', 103]
  ]);

  function createPrisma(options: { solutionExists?: boolean; conflictOnce?: boolean } = {}) {
    let solutionExists = options.solutionExists ?? true;
    let conflictOnce = options.conflictOnce ?? false;
    const solutionUpdate = jest.fn().mockImplementation(({ data }) => ({ id: 20, ...data }));
    const solutionCreate = jest.fn().mockImplementation(({ data }) => {
      if (conflictOnce) {
        conflictOnce = false;
        solutionExists = true;
        return Promise.reject({ code: 'P2002' });
      }

      solutionExists = true;
      return { id: 20, ...data };
    });
    const featureUpdate = jest.fn().mockImplementation(({ where, data }) => ({ id: where.id, solucaoId: 20, ...data }));
    const featureCreate = jest.fn().mockImplementation(({ data }) => ({ id: featureIds.get(data.slug), ...data }));
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      solucao: {
        findUnique: jest.fn().mockImplementation(() => solutionExists ? { id: 20 } : null),
        update: solutionUpdate,
        create: solutionCreate
      },
      funcionalidade: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const slug = where.solucaoId_slug.slug;
          return options.solutionExists ? { id: featureIds.get(slug), solucaoId: 20, slug } : null;
        }),
        update: featureUpdate,
        create: featureCreate
      },
      grupoFuncionalidadeAcao: { deleteMany },
      grupoFuncionalidade: { deleteMany },
      empresaFuncionalidade: { deleteMany },
      grupoSolucao: { deleteMany },
      empresaSolucao: { deleteMany }
    };

    return { prisma, solutionCreate, solutionUpdate, featureCreate, featureUpdate, deleteMany };
  }

  it('converge a solucao e as tres funcionalidades para o catalogo indisponivel', async () => {
    const setup = createPrisma({ solutionExists: true });
    const actions = { syncFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined) };

    await new SolucaoHorasBootstrapService(setup.prisma as never, actions as never)
      .ensureHorasSolutionUnavailable();

    expect(setup.solutionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ slug: 'horas', ativo: false, exibirNoHub: false, padraoSistema: true })
    }));
    expect(setup.featureUpdate).toHaveBeenCalledTimes(3);
    expect(setup.featureUpdate.mock.calls.every(([call]) => call.data.ativo === false && call.data.padraoSistema === true)).toBe(true);
    expect(actions.syncFuncionalidadeAcoes).toHaveBeenCalledTimes(3);
    expect(setup.deleteMany).toHaveBeenCalledTimes(5);
  });

  it('repete a reconciliacao quando outra instancia cria a solucao primeiro', async () => {
    const setup = createPrisma({ solutionExists: false, conflictOnce: true });
    const actions = { syncFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined) };

    await expect(new SolucaoHorasBootstrapService(setup.prisma as never, actions as never)
      .ensureHorasSolutionUnavailable()).resolves.toBeUndefined();

    expect(setup.solutionCreate).toHaveBeenCalledTimes(1);
    expect(setup.solutionUpdate).toHaveBeenCalledTimes(1);
    expect(setup.featureCreate).toHaveBeenCalledTimes(3);
  });
});
