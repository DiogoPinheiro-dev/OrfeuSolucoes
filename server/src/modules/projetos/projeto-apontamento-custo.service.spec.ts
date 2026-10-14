import { ConflictException } from '@nestjs/common';
import { ProjetoApontamentoCustoService } from './projeto-apontamento-custo.service';
import { ProjetoPeriodoService } from './projeto-periodo.service';

describe('ProjetoApontamentoCustoService', () => {
  const user = { sub: 'gestora-1', empresaId: 7 } as never;
  const escopo = { empresaId: 7, projetoId: 'projeto-1' };
  const apontamento = {
    id: 'apontamento-1',
    usuarioId: 'analista-1',
    itemId: null,
    dataTrabalho: new Date('2026-09-14T00:00:00.000Z'),
    minutos: 90,
    versao: 2,
    status: 'APROVADO',
    custoSituacao: 'SEM_TAXA'
  };
  const criarPrisma = (orcamento: { id: string; moeda: string } | null) => ({
    projetoOrcamento: { findUnique: jest.fn().mockResolvedValue(orcamento) },
    recurso: { findMany: jest.fn().mockResolvedValue([{ id: 'recurso-1', usuarioId: 'analista-1' }]) },
    projetoRecurso: { findMany: jest.fn().mockResolvedValue([{ id: 'vinculo-1', recursoId: 'recurso-1' }]) },
    projetoCusto: {
      findMany: jest.fn().mockResolvedValue([{ id: 'linha-1', recursoId: 'vinculo-1', itemId: null, taxaHora: '120.0000', taxas: [] }])
    },
    projetoApontamento: {
      findMany: jest.fn().mockResolvedValue([apontamento]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 })
    }
  });
  const criarServico = (prisma: ReturnType<typeof criarPrisma>) => {
    const authorization = {
      contextoFinanceiro: jest.fn().mockResolvedValue({ empresaId: 7, projeto: { id: 'projeto-1' }, papel: 'RESPONSAVEL' })
    };
    const comTransacao = {
      ...prisma,
      $transaction: jest.fn(async (operacao: (client: unknown) => Promise<unknown>) => operacao(prisma))
    };
    return new ProjetoApontamentoCustoService(comTransacao as never, authorization as never, new ProjetoPeriodoService(), {} as never);
  };

  it('marca sem taxa quando o projeto ainda nao tem orcamento, sem procurar vinculos nem linhas', async () => {
    const prisma = criarPrisma(null);
    const custoDe = await criarServico(prisma).calculadora([apontamento], escopo, prisma as never);

    expect(custoDe(apontamento)).toEqual({
      custoSituacao: 'SEM_TAXA', custoId: null, taxaHistoricoId: null, taxaHoraAplicada: null, valorCusto: null, moeda: null
    });
    expect(prisma.projetoRecurso.findMany).not.toHaveBeenCalled();
    expect(prisma.projetoCusto.findMany).not.toHaveBeenCalled();
  });

  it('nao consulta recursos quando nao ha apontamentos', async () => {
    const prisma = criarPrisma({ id: 'orcamento-1', moeda: 'BRL' });

    await criarServico(prisma).calculadora([], escopo, prisma as never);

    expect(prisma.recurso.findMany).not.toHaveBeenCalled();
  });

  it('recusa o recalculo quando o apontamento muda durante a transacao, sem gravar auditoria', async () => {
    const prisma = criarPrisma({ id: 'orcamento-1', moeda: 'BRL' });

    await expect(criarServico(prisma).recalcular({ projetoId: 'projeto-1' }, user)).rejects.toThrow(
      new ConflictException('O apontamento foi alterado em outra tela ou por outra pessoa. Atualize os dados.')
    );
    expect(prisma.projetoApontamento.updateMany).toHaveBeenCalledWith({
      where: { id: 'apontamento-1', versao: 2, status: 'APROVADO', custoSituacao: 'SEM_TAXA' },
      data: expect.objectContaining({ custoSituacao: 'CALCULADO', custoId: 'linha-1', valorCusto: '180.00', moeda: 'BRL', versao: { increment: 1 } })
    });
  });
});
