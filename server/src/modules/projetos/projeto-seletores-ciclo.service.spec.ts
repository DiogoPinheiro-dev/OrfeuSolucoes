import { ProjetoBacklogService } from './projeto-backlog.service';
import { ProjetoOrcamentoService } from './projeto-orcamento.service';
import { ProjetoSituacao } from './types/projeto.types';

describe('Seletores de projeto por ciclo de vida', () => {
  const user = { sub: 'usuario-1', empresaId: 7 } as any;

  it('restringe o seletor do backlog a projetos em rascunho', async () => {
    const prisma = { projeto: { findMany: jest.fn().mockResolvedValue([]) } } as any;
    const authorization = {
      assertFeatureActionAccess: jest.fn().mockResolvedValue(7),
      visibilityWhere: jest.fn().mockReturnValue({ membros: { some: { usuarioId: user.sub } } })
    } as any;
    const service = new ProjetoBacklogService(prisma, authorization, {} as any, {} as any);

    await service.projetos(user);

    expect(prisma.projeto.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        empresaId: 7,
        situacao: ProjetoSituacao.RASCUNHO,
        arquivadoEm: null
      })
    }));
  });

  it('restringe o seletor de orçamento a projetos ativos em orçamento', async () => {
    const prisma = { projeto: { findMany: jest.fn().mockResolvedValue([]) } } as any;
    const authorization = {
      projetos: jest.fn().mockResolvedValue({ where: { empresaId: 7, responsavelId: user.sub } })
    } as any;
    const service = new ProjetoOrcamentoService(prisma, authorization, {} as any);

    await service.projetos(user);

    expect(prisma.projeto.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        empresaId: 7,
        responsavelId: user.sub,
        situacao: ProjetoSituacao.EM_ORCAMENTO,
        arquivadoEm: null
      }
    }));
  });
});
