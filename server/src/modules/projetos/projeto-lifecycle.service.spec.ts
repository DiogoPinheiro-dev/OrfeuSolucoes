import { ConflictException } from '@nestjs/common';
import { ProjetoLifecycleService } from './projeto-lifecycle.service';
import { ProjetoSituacao } from './types/projeto.types';

describe('ProjetoLifecycleService: aprovação obrigatória', () => {
  const setup = () => {
    const prisma = { projeto: {
      findFirst: jest.fn().mockResolvedValue({ id: 'p1', empresaId: 7, situacao: ProjetoSituacao.EM_ORCAMENTO, arquivadoEm: null, responsavelId: 'u1', membros: [] }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    } };
    const authorization = {
      assertReadAccess: jest.fn().mockResolvedValue(7), assertVisibleProject: jest.fn(),
      assertCanChangeStatus: jest.fn(), isSystemAdmin: jest.fn().mockReturnValue(true)
    };
    const query = { findOne: jest.fn() };
    const service = new ProjetoLifecycleService(prisma as never, authorization as never, query as never);
    return { prisma, query, service };
  };

  it.each([ProjetoSituacao.RASCUNHO, ProjetoSituacao.PLANEJADO])('bloqueia avanço manual para %s mesmo para administrador', async (situacao) => {
    const { prisma, service } = setup();
    await expect(service.atualizarCiclo({ projetoId: 'p1', situacao }, { sub: 'u1' } as never))
      .rejects.toThrow('Aprove o orçamento');
    expect(prisma.projeto.updateMany).not.toHaveBeenCalled();
  });

  it('não sobrescreve o ciclo após uma aprovação concorrente', async () => {
    const { prisma, query, service } = setup();
    prisma.projeto.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.atualizarCiclo({ projetoId: 'p1', situacao: ProjetoSituacao.CANCELADO }, { sub: 'u1' } as never))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.projeto.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', empresaId: 7, situacao: ProjetoSituacao.EM_ORCAMENTO, arquivadoEm: null },
      data: { situacao: ProjetoSituacao.CANCELADO, fimRealEm: expect.any(Date) }
    });
    expect(query.findOne).not.toHaveBeenCalled();
  });
});
