import { BadRequestException } from '@nestjs/common';
import { SolucaoCatalogService } from './solucao-catalog.service';

describe('SolucaoCatalogService', () => {
  it('nega alteracao direta de solucao publicada e orienta o ciclo versionado', async () => {
    const prisma = { solucao: { findUnique: jest.fn().mockResolvedValue({ id: 1, padraoSistema: true, statusPublicacao: 'PUBLICADA' }) } };
    const service = new SolucaoCatalogService(prisma as never, {} as never, {} as never);

    await expect(service.update({ id: 1, nome: 'Customizada' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.solucao).not.toHaveProperty('update');
  });

  it('nao injeta acoes CRUD ao criar funcionalidade administrativa', async () => {
    const created = { id: 10, solucaoId: 1, slug: 'relatorio', titulo: 'Relatorio', ordem: 0, ativo: true, somenteAdminSistema: false, padraoSistema: false, statusPublicacao: 'RASCUNHO' };
    const prisma = {
      solucao: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
      funcionalidade: { create: jest.fn().mockResolvedValue(created), findUniqueOrThrow: jest.fn().mockResolvedValue({ ...created, acoes: [] }) }
    };
    const actions = { syncFuncionalidadeAcoes: jest.fn().mockResolvedValue(undefined) };
    const service = new SolucaoCatalogService(prisma as never, actions as never, {} as never);

    await service.createFuncionalidade({ solucaoId: 1, slug: 'relatorio', titulo: 'Relatorio' });
    expect(actions.syncFuncionalidadeAcoes).toHaveBeenCalledWith(10, undefined, { includeDefaultActions: false });
  });
});
