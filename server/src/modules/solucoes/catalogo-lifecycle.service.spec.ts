import { BadRequestException, ConflictException } from '@nestjs/common';
import { CatalogoLifecycleService } from './catalogo-lifecycle.service';
import { CatalogoProviderRegistry } from './catalogo-provider.registry';
import { CatalogoValidationService } from './catalogo-validation.service';

const feature = {
  id: 10, solucaoId: 1, slug: 'backlog', titulo: 'Backlog', label: 'Backlog', descricao: null,
  ordem: 10, ativo: true, registryKey: 'projetos.backlog-de-demandas', providerKey: 'projetos.backlog-de-demandas',
  providerVersion: 1, somenteAdminSistema: false, versaoDefinicao: 1, chaveTecnica: 'projetos.backlog-de-demandas',
  statusPublicacao: 'PUBLICADA', revisaoCatalogo: 1, publicadoEm: new Date(), padraoSistema: true
};

describe('CatalogoLifecycleService', () => {
  it('cria rascunho de solucao sem alterar o snapshot publicado', async () => {
    const solution = { id: 1, slug: 'projetos', nome: 'Projetos', descricao: null, eyebrow: null, ordem: 1, ativo: true, exibirNoHub: true, somenteAdminSistema: false, versaoDefinicao: 1 };
    const draft = { id: 'solution-draft', solucaoId: 1, numero: 2, estado: 'RASCUNHO', snapshot: '{}', motivo: null };
    const db = { solucao: { findUnique: jest.fn().mockResolvedValue(solution) }, catalogoVersao: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ numero: 1, baselineSnapshot: '{}' }), create: jest.fn().mockResolvedValue(draft) }, catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) } };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.createSolutionDraft(1, 'author')).resolves.toBe(draft);
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ solucaoId: 1, estado: 'RASCUNHO', numero: 2 }) }));
    expect(db.solucao.findUnique).toHaveBeenCalledTimes(1);
  });

  it('publica solucao sem publicar ou conceder acesso a funcionalidades', async () => {
    const snapshot = JSON.stringify({ slug: 'projetos', nome: 'Gestao de projetos', descricao: null, eyebrow: null, ordem: 1, ativo: true, exibirNoHub: true, somenteAdminSistema: false });
    const draft = { id: 'solution-draft', solucaoId: 1, estado: 'RASCUNHO', revisao: 1, snapshot, motivo: null, conflitos: [] };
    const published = { ...draft, estado: 'PUBLICADA', publicadoEm: new Date() };
    const db = { catalogoVersao: { findUnique: jest.fn().mockResolvedValue(draft), findFirst: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue(published) }, solucao: { update: jest.fn().mockResolvedValue({}) }, catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) } };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.publishSolutionDraft('solution-draft', 1, 'author')).resolves.toBe(published);
    expect(db.solucao.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ nome: 'Gestao de projetos', statusPublicacao: 'PUBLICADA' }) }));
    expect(db).not.toHaveProperty('grupoFuncionalidade');
  });

  it('restaura baseline de solucao como novo rascunho', async () => {
    const published = { id: 'published', solucaoId: 1, estado: 'PUBLICADA', numero: 2, versaoDefinicao: 1, snapshot: '{"nome":"Custom"}', baselineSnapshot: '{"nome":"Padrao"}' };
    const restored = { id: 'restored', solucaoId: 1, estado: 'RASCUNHO', numero: 3, origem: 'RESTAURACAO', snapshot: published.baselineSnapshot, motivo: 'Restaurar padrao' };
    const db = { catalogoVersao: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ numero: 2 }), create: jest.fn().mockResolvedValue(restored) }, catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) } };
    const prisma = { catalogoVersao: { findFirst: jest.fn().mockResolvedValue(published) }, $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.restoreSolutionBaseline(1, 'author', 'Restaurar padrao')).resolves.toBe(restored);
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ snapshot: published.baselineSnapshot, origem: 'RESTAURACAO' }) }));
  });

  it('cria rascunho e auditoria na mesma transacao', async () => {
    const draft = { id: 'draft-1', funcionalidadeId: 10, numero: 2, estado: 'RASCUNHO', revisao: 1, snapshot: '{}', motivo: null };
    const db = {
      funcionalidade: { findUnique: jest.fn().mockResolvedValue(feature) },
      catalogoVersao: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ numero: 1, baselineSnapshot: '{}' }),
        create: jest.fn().mockResolvedValue(draft)
      },
      catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.createFeatureDraft(10, '00000000-0000-0000-0000-000000000001')).resolves.toBe(draft);
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: 'RASCUNHO', numero: 2 }) }));
    expect(db.catalogoAuditoria.create).toHaveBeenCalledTimes(1);
  });

  it('rejeita segundo rascunho para a mesma funcionalidade', async () => {
    const db = {
      funcionalidade: { findUnique: jest.fn().mockResolvedValue(feature) },
      catalogoVersao: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }) }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.createFeatureDraft(10, 'author')).rejects.toBeInstanceOf(ConflictException);
  });

  it('localiza rascunhos atuais de funcionalidade e acao para retomar o fluxo', async () => {
    const findFirst = jest.fn()
      .mockResolvedValueOnce({ id: 'feature-draft' })
      .mockResolvedValueOnce({ id: 'action-draft' });
    const service = new CatalogoLifecycleService(
      { catalogoVersao: { findFirst } } as never,
      new CatalogoValidationService(new CatalogoProviderRegistry())
    );

    await expect(service.findFeatureDraft(10)).resolves.toEqual({ id: 'feature-draft' });
    await expect(service.findActionDraft(5)).resolves.toEqual({ id: 'action-draft' });
    expect(findFirst).toHaveBeenNthCalledWith(1, { where: { funcionalidadeId: 10, estado: 'RASCUNHO' }, orderBy: { numero: 'desc' } });
    expect(findFirst).toHaveBeenNthCalledWith(2, { where: { funcionalidadeAcaoId: 5, estado: 'RASCUNHO' }, orderBy: { numero: 'desc' } });
  });

  it('bloqueia publicacao quando o snapshot nao possui provider', async () => {
    const prisma = {
      catalogoVersao: { findUnique: jest.fn().mockResolvedValue({ id: 'draft', funcionalidadeId: 10, estado: 'RASCUNHO', snapshot: JSON.stringify({ ...feature, providerKey: null }), conflitos: [] }) },
      funcionalidade: { findUnique: jest.fn().mockResolvedValue(feature) },
      $transaction: jest.fn()
    };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.publishFeatureDraft('draft', 1, 'author')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita salvamento concorrente de rascunho', async () => {
    const db = {
      catalogoVersao: {
        findUnique: jest.fn().mockResolvedValue({ id: 'draft', funcionalidadeId: 10, estado: 'RASCUNHO', revisao: 2, snapshot: JSON.stringify(feature), motivo: null }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 })
      }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.updateFeatureDraft({ versaoId: 'draft', revisaoEsperada: 1, titulo: 'Outro titulo' }, 'author')).rejects.toBeInstanceOf(ConflictException);
    expect(db.catalogoVersao.updateMany).not.toHaveBeenCalled();
  });

  it('publica o rascunho e substitui a versao anterior atomicamente', async () => {
    const snapshot = JSON.stringify(feature);
    const draft = { id: 'draft', funcionalidadeId: 10, estado: 'RASCUNHO', revisao: 1, snapshot, motivo: null, conflitos: [] };
    const previous = { id: 'published-1', snapshot: '{}' };
    const published = { ...draft, estado: 'PUBLICADA', publicadoEm: new Date() };
    const db = {
      catalogoVersao: {
        findUnique: jest.fn().mockResolvedValue(draft),
        findFirst: jest.fn().mockResolvedValue(previous),
        update: jest.fn().mockResolvedValueOnce({ ...previous, estado: 'SUBSTITUIDA' }).mockResolvedValueOnce(published)
      },
      funcionalidade: { update: jest.fn().mockResolvedValue(feature) },
      catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) }
    };
    const prisma = {
      catalogoVersao: { findUnique: jest.fn().mockResolvedValue(draft) },
      funcionalidade: { findUnique: jest.fn().mockResolvedValue(feature) },
      $transaction: jest.fn((callback) => callback(db))
    };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.publishFeatureDraft('draft', 1, 'author')).resolves.toBe(published);
    expect(db.catalogoVersao.update).toHaveBeenNthCalledWith(1, { where: { id: previous.id }, data: { estado: 'SUBSTITUIDA' } });
    expect(db.funcionalidade.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ statusPublicacao: 'PUBLICADA' }) }));
    expect(db.catalogoAuditoria.create).toHaveBeenCalledTimes(1);
  });

  it('restaura versao historica como novo rascunho sem reescrever o historico', async () => {
    const source = { id: 'old', funcionalidadeId: 10, estado: 'SUBSTITUIDA', numero: 1, versaoDefinicao: 1, snapshot: '{}', baselineSnapshot: '{}' };
    const restored = { ...source, id: 'restored', estado: 'RASCUNHO', numero: 3, origem: 'RESTAURACAO', motivo: 'Rollback controlado' };
    const db = {
      catalogoVersao: {
        findUnique: jest.fn().mockResolvedValue(source),
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ numero: 2 }),
        create: jest.fn().mockResolvedValue(restored)
      },
      catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.restoreFeatureVersion('old', 'author', 'Rollback controlado')).resolves.toBe(restored);
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ numero: 3, estado: 'RASCUNHO', origem: 'RESTAURACAO' }) }));
    expect(db.catalogoAuditoria.create).toHaveBeenCalledTimes(1);
  });

  it('bloqueia publicacao de acao sem consumidor registrado', async () => {
    const draft = { id: 'action-draft', funcionalidadeAcaoId: 5, estado: 'RASCUNHO', snapshot: JSON.stringify({ funcionalidadeId: 10, chave: 'exportar', nome: 'Exportar', descricao: null, ordem: 1, ativo: true, configuracao: null, consumerKey: null, consumerVersion: null }), conflitos: [] };
    const prisma = { catalogoVersao: { findUnique: jest.fn().mockResolvedValue(draft) }, $transaction: jest.fn() };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.publishActionDraft('action-draft', 1, 'author')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('publica acao criando permissoes ausentes com negacao por padrao', async () => {
    const snapshot = JSON.stringify({ funcionalidadeId: 10, chave: 'visualizar', nome: 'Visualizar', descricao: null, ordem: 1, ativo: true, configuracao: 'visualizar', consumerKey: 'visualizar', consumerVersion: 1 });
    const draft = { id: 'action-draft', funcionalidadeAcaoId: 5, estado: 'RASCUNHO', revisao: 1, snapshot, motivo: null, conflitos: [] };
    const published = { ...draft, estado: 'PUBLICADA', publicadoEm: new Date() };
    const db = {
      catalogoVersao: { findUnique: jest.fn().mockResolvedValue(draft), findFirst: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue(published) },
      funcionalidadeAcao: { update: jest.fn().mockResolvedValue({}) },
      grupoFuncionalidade: { findMany: jest.fn().mockResolvedValue([{ grupoId: 2 }]) },
      grupoFuncionalidadeAcao: { upsert: jest.fn().mockResolvedValue({}) },
      catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) }
    };
    const prisma = { catalogoVersao: { findUnique: jest.fn().mockResolvedValue(draft) }, $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.publishActionDraft('action-draft', 1, 'author')).resolves.toBe(published);
    expect(db.grupoFuncionalidadeAcao.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ permitido: false }) }));
  });

  it('restaura versao historica da acao como novo rascunho', async () => {
    const source = { id: 'old-action', funcionalidadeAcaoId: 5, estado: 'SUBSTITUIDA', numero: 1, versaoDefinicao: 1, snapshot: '{}', baselineSnapshot: '{}' };
    const restored = { ...source, id: 'restored-action', estado: 'RASCUNHO', numero: 3, origem: 'RESTAURACAO', motivo: 'Rollback' };
    const db = { catalogoVersao: { findUnique: jest.fn().mockResolvedValue(source), findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ numero: 2 }), create: jest.fn().mockResolvedValue(restored) }, catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) } };
    const prisma = { $transaction: jest.fn((callback) => callback(db)) };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.restoreActionVersion('old-action', 'author', 'Rollback')).resolves.toBe(restored);
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: 'RASCUNHO', origem: 'RESTAURACAO' }) }));
  });

  it('atualiza rascunho de solução com revisão otimista e auditoria', async () => {
    const current = { slug: 'projetos', nome: 'Projetos', descricao: null, eyebrow: null, ordem: 1, ativo: true, exibirNoHub: true, somenteAdminSistema: false };
    const draft = { id: 'solution-draft', solucaoId: 1, estado: 'RASCUNHO', revisao: 2, snapshot: JSON.stringify(current), motivo: null };
    const updated = { ...draft, revisao: 3, snapshot: JSON.stringify({ ...current, nome: 'Gestão de projetos' }), motivo: 'Ajuste' };
    const db = { catalogoVersao: { findUnique: jest.fn().mockResolvedValue(draft), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue(updated) }, catalogoAuditoria: { create: jest.fn() } };
    const service = new CatalogoLifecycleService({ $transaction: (callback: any) => callback(db) } as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.updateSolutionDraft({ versaoId: draft.id, revisaoEsperada: 2, nome: ' Gestão de projetos ', motivo: ' Ajuste ' }, 'author')).resolves.toBe(updated);
    expect(db.catalogoVersao.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: draft.id, estado: 'RASCUNHO', revisao: 2 } }));
    expect(db.catalogoAuditoria.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ evento: 'RASCUNHO_ALTERADO' }) }));
  });

  it('despublica solução, funcionalidade e ação somente com motivo e estado publicado', async () => {
    const solution = { slug: 'projetos', nome: 'Projetos', descricao: null, eyebrow: null, ordem: 1, ativo: true, exibirNoHub: true, somenteAdminSistema: false, statusPublicacao: 'PUBLICADA' };
    const action = { funcionalidadeId: 10, chave: 'visualizar', nome: 'Visualizar', descricao: null, ordem: 1, ativo: true, configuracao: null, consumerKey: 'visualizar', consumerVersion: 1, statusPublicacao: 'PUBLICADA' };
    const db: any = {
      solucao: { findUnique: jest.fn().mockResolvedValue(solution), update: jest.fn().mockResolvedValue({ ...solution, statusPublicacao: 'DESPUBLICADA' }) },
      funcionalidade: { findUnique: jest.fn().mockResolvedValue(feature), update: jest.fn().mockResolvedValue({ ...feature, statusPublicacao: 'DESPUBLICADA' }) },
      funcionalidadeAcao: { findUnique: jest.fn().mockResolvedValue(action), update: jest.fn().mockResolvedValue({ ...action, statusPublicacao: 'DESPUBLICADA' }) },
      catalogoAuditoria: { create: jest.fn() }
    };
    const service = new CatalogoLifecycleService({ $transaction: (callback: any) => callback(db) } as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.unpublishSolution(1, 'author', ' Ocultar ')).resolves.toMatchObject({ statusPublicacao: 'DESPUBLICADA' });
    await expect(service.unpublishFeature(10, 'author', ' Ocultar ')).resolves.toMatchObject({ statusPublicacao: 'DESPUBLICADA' });
    await expect(service.unpublishAction(5, 'author', ' Ocultar ')).resolves.toMatchObject({ statusPublicacao: 'DESPUBLICADA' });
    expect(db.catalogoAuditoria.create).toHaveBeenCalledTimes(3);
  });

  it('recusa despublicação sem motivo antes de abrir transação', async () => {
    const prisma = { $transaction: jest.fn() };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.unpublishSolution(1, 'author', ' ')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.unpublishFeature(10, 'author', ' ')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.unpublishAction(5, 'author', ' ')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cria e atualiza rascunho de ação preservando identidade técnica', async () => {
    const action = { funcionalidadeId: 10, chave: 'exportar', nome: 'Exportar', descricao: null, ordem: 1, ativo: true, configuracao: null, consumerKey: 'visualizar', consumerVersion: 1, versaoDefinicao: 1 };
    const draft = { id: 'action-draft', funcionalidadeAcaoId: 5, estado: 'RASCUNHO', revisao: 1, snapshot: JSON.stringify(action), motivo: null };
    const updated = { ...draft, revisao: 2, snapshot: JSON.stringify({ ...action, nome: 'Exportar dados' }) };
    const db = {
      funcionalidadeAcao: { findUnique: jest.fn().mockResolvedValue(action) },
      catalogoVersao: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null), create: jest.fn().mockResolvedValue(draft), findUnique: jest.fn().mockResolvedValue(draft), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue(updated) },
      catalogoAuditoria: { create: jest.fn() }
    };
    const service = new CatalogoLifecycleService({ $transaction: (callback: any) => callback(db) } as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.createActionDraft(5, 'author')).resolves.toBe(draft);
    await expect(service.updateActionDraft({ versaoId: draft.id, revisaoEsperada: 1, nome: ' Exportar dados ' }, 'author')).resolves.toBe(updated);
    const savedSnapshot = JSON.parse(db.catalogoVersao.updateMany.mock.calls[0][0].data.snapshot);
    expect(savedSnapshot).toMatchObject({ funcionalidadeId: 10, chave: 'exportar', nome: 'Exportar dados' });
  });

  it('reporta consumidor incompatível e conflitos pendentes antes de publicar ação', async () => {
    const actionConsumers = { isCompatible: jest.fn().mockReturnValue(false) };
    const prisma = { catalogoVersao: { findUnique: jest.fn().mockResolvedValue({ funcionalidadeAcaoId: 5, estado: 'RASCUNHO', snapshot: JSON.stringify({ consumerKey: 'inexistente', consumerVersion: 99 }), conflitos: [{ id: 'conflict' }] }) } };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()), actionConsumers as never);

    await expect(service.validateActionDraft('draft')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CONSUMER_INCOMPATIBLE' }),
      expect.objectContaining({ code: 'CONFLICTS_PENDING' })
    ]));
  });

  it('recusa restauração de baseline ausente sem abrir transação', async () => {
    const prisma = { catalogoVersao: { findFirst: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn() };
    const service = new CatalogoLifecycleService(prisma as never, new CatalogoValidationService(new CatalogoProviderRegistry()));

    await expect(service.restoreSolutionBaseline(1, 'author', 'Restaurar')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.restoreFeatureBaseline(10, 'author', 'Restaurar')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.restoreActionBaseline(5, 'author', 'Restaurar')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
