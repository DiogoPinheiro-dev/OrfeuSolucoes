import { BadRequestException } from '@nestjs/common';
import { ProjetoOrcamentoService } from './projeto-orcamento.service';

describe('ProjetoOrcamentoService com itens do backlog', () => {
  const user = { sub: '11111111-1111-4111-8111-111111111111' } as never;
  const contexto = {
    empresaId: 7,
    projeto: { id: '22222222-2222-4222-8222-222222222222' }
  };

  function setup(responsavelId = '33333333-3333-4333-8333-333333333333') {
    const prisma = {
      projetoOrcamento: { findUnique: jest.fn().mockResolvedValue({ id: 'orcamento', moeda: 'BRL', status: 'RASCUNHO' }) },
      projetoOrcamentoCategoria: { findFirst: jest.fn() },
      projetoRecurso: {
        findFirst: jest.fn().mockResolvedValue({
          id: '44444444-4444-4444-8444-444444444444',
          ativo: true,
          cadastro: { ativo: true, usuarioId: responsavelId }
        })
      },
      projetoItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: '55555555-5555-4555-8555-555555555555',
          projetoId: contexto.projeto.id,
          responsavelId,
          arquivadoEm: null
        })
      },
      projetoCusto: { findFirst: jest.fn() }
    };
    const authorization = {
      contexto: jest.fn().mockResolvedValue(contexto),
      gerenciarFinanceiro: jest.fn().mockResolvedValue(undefined)
    };
    return { service: new ProjetoOrcamentoService(prisma as never, authorization as never, {} as never), prisma };
  }

  it('valida o item no mesmo projeto e atribuído ao recurso selecionado', async () => {
    const { service, prisma } = setup();

    await expect((service as any).assertItem(
      contexto,
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555'
    )).resolves.toBeUndefined();

    expect(prisma.projetoItem.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        empresaId: 7,
        projetoId: contexto.projeto.id,
        responsavelId: '33333333-3333-4333-8333-333333333333'
      })
    }));
  });

  it('rejeita item que não pertence ao recurso do projeto', async () => {
    const { service, prisma } = setup();
    prisma.projetoItem.findFirst.mockResolvedValue(null);

    await expect((service as any).assertItem(
      contexto,
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555'
    )).rejects.toThrow(BadRequestException);
  });

  it('rejeita item arquivado em um custo novo', async () => {
    const { service, prisma } = setup();
    prisma.projetoItem.findFirst.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      arquivadoEm: new Date()
    });

    await expect((service as any).assertItem(
      contexto,
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555'
    )).rejects.toThrow('Selecione um item ativo do projeto');
  });
});
