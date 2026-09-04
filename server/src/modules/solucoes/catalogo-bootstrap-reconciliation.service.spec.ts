import { CatalogoBootstrapReconciliationService } from './catalogo-bootstrap-reconciliation.service';

describe('CatalogoBootstrapReconciliationService', () => {
  it('registra baseline inicial como versao publicada', async () => {
    const version = { id: 'v1', snapshot: '{"nome":"Padrao"}' };
    const db = { catalogoVersao: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(version) }, catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) } };
    const service = new CatalogoBootstrapReconciliationService({ $transaction: jest.fn((callback) => callback(db)) } as never);

    await service.reconcileSolution(1, { nome: 'Padrao' }, { nome: 'Padrao' });
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: 'PUBLICADA', origem: 'PRODUTO', baselineSnapshot: '{"nome":"Padrao"}' }) }));
  });

  it('nao cria rascunho quando o baseline nao mudou', async () => {
    const db = { catalogoVersao: { findFirst: jest.fn().mockResolvedValue({ id: 'v1', snapshot: '{}', baselineSnapshot: '{"nome":"Padrao"}' }), create: jest.fn() } };
    const service = new CatalogoBootstrapReconciliationService({ $transaction: jest.fn((callback) => callback(db)) } as never);

    await service.reconcileSolution(1, { nome: 'Custom' }, { nome: 'Padrao' });
    expect(db.catalogoVersao.create).not.toHaveBeenCalled();
  });

  it('preserva override e registra conflito quando produto e administrador alteram o campo', async () => {
    const published = { id: 'v1', numero: 1, versaoDefinicao: 1, snapshot: '{"nome":"Custom"}', baselineSnapshot: '{"nome":"Padrao antigo"}' };
    const draft = { id: 'v2', snapshot: '{"nome":"Custom"}' };
    const db = {
      catalogoVersao: { findFirst: jest.fn().mockResolvedValueOnce(published).mockResolvedValueOnce(null).mockResolvedValueOnce(published), create: jest.fn().mockResolvedValue(draft) },
      catalogoConflito: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }), create: jest.fn().mockResolvedValue({}) },
      catalogoAuditoria: { create: jest.fn().mockResolvedValue({}) }
    };
    const service = new CatalogoBootstrapReconciliationService({ $transaction: jest.fn((callback) => callback(db)) } as never);

    await service.reconcileSolution(1, { nome: 'Custom' }, { nome: 'Padrao novo' });
    expect(db.catalogoVersao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ snapshot: '{"nome":"Custom"}', baselineSnapshot: '{"nome":"Padrao novo"}' }) }));
    expect(db.catalogoConflito.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ campo: 'nome' }) }));
  });
});
