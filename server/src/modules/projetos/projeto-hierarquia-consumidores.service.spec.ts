import { ForbiddenException } from '@nestjs/common';
import { ProjetoComunicacaoService } from './projeto-comunicacao.service';
import { ProjetoCronogramaService } from './projeto-cronograma.service';
import { ProjetoMarcoEntregaService } from './projeto-marco-entrega.service';
import { ProjetoSprintService } from './projeto-sprint.service';

const user = { sub: 'usuario-supervisor' } as never;
const contexto = {
  empresaId: 7,
  projeto: {
    id: 'projeto-1',
    responsavelId: 'usuario-gerente',
    responsavel: { id: 'usuario-gerente' },
    membros: []
  }
} as never;
const escopo = {
  restrito: true,
  recursoIds: ['recurso-supervisor', 'recurso-junior'],
  usuarioIds: ['usuario-supervisor', 'usuario-junior']
};
const filtroItens = { responsavelId: { in: escopo.usuarioIds } };

const hierarquia = () => ({
  escopo: jest.fn().mockResolvedValue(escopo),
  filtroProjetoItem: jest.fn().mockReturnValue(filtroItens),
  assertPodeAcessarResponsavel: jest.fn(),
  assertVisaoCompleta: jest.fn((scope) => {
    if (scope.restrito) throw new ForbiddenException('visão restrita');
  })
});

describe('Hierarquia nos consumidores de itens', () => {
  it('filtra itens, vínculos e dependências do cronograma', async () => {
    const prisma = {
      projetoItem: { findMany: jest.fn().mockResolvedValue([]) },
      projetoMarco: { findMany: jest.fn().mockResolvedValue([]) },
      projetoEntrega: { findMany: jest.fn().mockResolvedValue([]) },
      projetoItemDependencia: { findMany: jest.fn().mockResolvedValue([]) }
    };
    const authorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      effectivePermissions: jest.fn().mockResolvedValue({})
    };
    const service = new ProjetoCronogramaService(
      prisma as never,
      authorization as never,
      {} as never,
      hierarquia() as never
    );

    await service.painel({ projetoId: 'projeto-1' } as never, user);

    expect(prisma.projetoItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining(filtroItens)
      })
    );
    expect(prisma.projetoItemDependencia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bloqueador: filtroItens,
          bloqueado: filtroItens
        })
      })
    );
    expect(prisma.projetoMarco.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          itens: expect.objectContaining({ where: { item: filtroItens } })
        })
      })
    );
  });

  it('filtra itens da sprint e impede transição global com visão parcial', async () => {
    const prisma = {
      projetoSprint: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'sprint-1',
          projetoId: 'projeto-1',
          status: 'PLANEJADA'
        })
      },
      projetoItem: { findMany: jest.fn().mockResolvedValue([]) }
    };
    const authorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      effectivePermissions: jest.fn().mockResolvedValue({
        podeVisualizar: true,
        podeCriar: true,
        podeEditar: true,
        podePlanejar: true,
        podeIniciar: true,
        podeConcluir: true,
        podeCancelar: true
      }),
      assertAction: jest.fn().mockResolvedValue(undefined)
    };
    const hierarchy = hierarquia();
    const service = new ProjetoSprintService(
      prisma as never,
      authorization as never,
      {} as never,
      {} as never,
      hierarchy as never
    );

    const painel = await service.painel('projeto-1', user);
    expect(prisma.projetoSprint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          itens: expect.objectContaining({ where: { item: filtroItens } })
        })
      })
    );
    expect(prisma.projetoItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining(filtroItens) })
    );
    expect(painel.permissoes).toMatchObject({
      podeCriar: true,
      podeEditar: true,
      podePlanejar: true,
      podeIniciar: false,
      podeConcluir: false,
      podeCancelar: false
    });
    await expect(service.iniciar({ id: 'sprint-1', versao: 1 }, user))
      .rejects.toThrow(ForbiddenException);
    expect(hierarchy.assertVisaoCompleta).toHaveBeenCalledWith(
      escopo,
      'iniciar a sprint'
    );
  });

  it('filtra itens dos marcos e bloqueia alterações globais', async () => {
    const prisma = {
      projetoMarco: { findMany: jest.fn().mockResolvedValue([]) },
      projetoEntrega: { findMany: jest.fn().mockResolvedValue([]) },
      projetoItem: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn()
    };
    const authorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      effectivePermissions: jest.fn().mockResolvedValue({
        podeVisualizar: true,
        podeCriar: true,
        podeEditar: true,
        podeArquivar: true,
        podeReativar: true
      }),
      assertAction: jest.fn().mockResolvedValue(undefined)
    };
    const hierarchy = hierarquia();
    const service = new ProjetoMarcoEntregaService(
      prisma as never,
      authorization as never,
      {} as never,
      {} as never,
      hierarchy as never
    );

    const painel = await service.painel('projeto-1', false, user);
    expect(prisma.projetoEntrega.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          itens: expect.objectContaining({ where: { item: filtroItens } })
        })
      })
    );
    expect(painel.permissoes).toEqual({
      podeVisualizar: true,
      podeCriar: false,
      podeEditar: false,
      podeArquivar: false,
      podeReativar: false
    });
    await expect(service.createMarco({ projetoId: 'projeto-1' } as never, user))
      .rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('filtra itens, comentários e eventos da comunicação', async () => {
    const prisma = {
      projetoItem: { findMany: jest.fn().mockResolvedValue([]) },
      projetoItemDependencia: { findMany: jest.fn().mockResolvedValue([]) },
      projetoComentario: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0)
      },
      projetoAtualizacao: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0)
      },
      projetoEvento: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0)
      }
    };
    const authorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      effectivePermissions: jest.fn().mockResolvedValue({})
    };
    const service = new ProjetoComunicacaoService(
      prisma as never,
      authorization as never,
      {} as never,
      {} as never,
      {
        resolver: jest.fn().mockResolvedValue({ registros: new Map(), contextos: new Map() }),
        chave: jest.fn((entidade, id) => `${entidade}:${id}`)
      } as never,
      { normalizePaginacao: () => ({ pagina: 1, limite: 20 }) } as never,
      hierarquia() as never
    );

    await service.painel('projeto-1', user);

    expect(prisma.projetoComentario.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [{ itemId: null }, { item: filtroItens }]
      })
    });
    expect(prisma.projetoItem.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.objectContaining(filtroItens) })
    );
    expect(prisma.projetoEvento.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ AND: expect.any(Array) })
    });
  });
});
