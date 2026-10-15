import { PROJETO_FEATURE_DEFINITIONS } from './constants/projeto-feature-definitions';
import { SolucaoProjetosBootstrapService } from './solucao-projetos-bootstrap.service';

describe('SolucaoProjetosBootstrapService', () => {
  it('é idempotente e não concede funcionalidades de horas a grupos comuns', async () => {
    const created = new Map<string, Record<string, unknown>>();
    const featureCreate = jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const feature = { id: created.size + 100, ...data };
      created.set(String(data.slug), feature);
      return feature;
    });
    const prisma = {
      solucao: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          slug: 'projetos',
          nome: 'Gerenciador de Projetos',
          descricao: 'Personalizada',
          eyebrow: 'Operação',
          ordem: 10,
          ativo: true,
          exibirNoHub: true,
          somenteAdminSistema: false
        })
      },
      funcionalidade: {
        findUnique: jest.fn(async ({ where }: { where: { solucaoId_slug: { slug: string } } }) =>
          created.get(where.solucaoId_slug.slug) ?? null),
        create: featureCreate
      }
    };
    const actions = { syncFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined) };
    const access = {
      syncNewFuncionalidadeAccess: jest.fn().mockResolvedValue(undefined),
      syncNewFuncionalidadeCompanyAccess: jest.fn().mockResolvedValue(undefined),
      copyFuncionalidadeAccess: jest.fn().mockResolvedValue(undefined)
    };
    const reconciliation = {
      reconcileSolution: jest.fn().mockResolvedValue(undefined),
      reconcileFeature: jest.fn().mockResolvedValue(undefined)
    };
    const groups = { ensureAgrupamentoPadrao: jest.fn().mockResolvedValue(undefined) };
    const service = new SolucaoProjetosBootstrapService(
      prisma as never,
      actions as never,
      access as never,
      reconciliation as never,
      groups as never
    );

    await service.ensureProjetosSolution();
    await service.ensureProjetosSolution();

    expect(featureCreate).toHaveBeenCalledTimes(PROJETO_FEATURE_DEFINITIONS.length);
    expect([...created.keys()]).toEqual(PROJETO_FEATURE_DEFINITIONS.map((feature) => feature.slug));
    expect(access.syncNewFuncionalidadeCompanyAccess.mock.calls.map(([feature]) => feature.slug)).toEqual([
      'meus-apontamentos',
      'horas-do-projeto'
    ]);
    expect(access.syncNewFuncionalidadeAccess.mock.calls.map(([feature]) => feature.slug)).not.toEqual(expect.arrayContaining([
      'meus-apontamentos',
      'horas-do-projeto'
    ]));
  });
});
