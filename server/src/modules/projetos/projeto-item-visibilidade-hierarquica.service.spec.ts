import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjetoItemCatalogService } from './projeto-item-catalog.service';
import { ProjetoItemQueryService } from './projeto-item-query.service';

const user = { sub: 'usuario-supervisor' } as never;
const contexto = {
  empresaId: 7,
  projeto: { id: 'projeto-1', backlogVersao: 3 },
  papel: 'MEMBRO'
} as never;
const escopo = {
  restrito: true,
  recursoIds: ['recurso-supervisor', 'recurso-junior'],
  usuarioIds: ['usuario-supervisor', 'usuario-junior']
};
const filtroVisibilidade = {
  responsavelId: { in: escopo.usuarioIds }
};

describe('Visibilidade hierárquica dos itens do projeto', () => {
  it('filtra a paginação pelos responsáveis visíveis no projeto', async () => {
    const prisma = {
      projetoItem: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([])
      }
    };
    const authorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      escopoHierarquico: jest.fn().mockResolvedValue(escopo),
      filtroVisibilidade: jest.fn().mockReturnValue(filtroVisibilidade),
      effectivePermissions: jest.fn().mockResolvedValue({ podeVisualizar: true })
    };
    const service = new ProjetoItemQueryService(
      prisma as never,
      authorization as never,
      { normalizePaginacao: () => ({ pagina: 1, limite: 20 }) } as never
    );

    await service.findPage(user, {
      projetoId: 'projeto-1',
      incluirArquivados: false
    } as never);

    expect(prisma.projetoItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresaId: 7,
          projetoId: 'projeto-1',
          arquivadoEm: null,
          ...filtroVisibilidade
        })
      })
    );
    expect(prisma.projetoItem.count).toHaveBeenCalledWith({
      where: expect.objectContaining(filtroVisibilidade)
    });
  });

  it('oculta acesso direto a item fora do escopo como não encontrado', async () => {
    const prisma = {
      projetoItem: {
        findUnique: jest.fn().mockResolvedValue({ projetoId: 'projeto-1' }),
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };
    const authorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      escopoHierarquico: jest.fn().mockResolvedValue(escopo),
      filtroVisibilidade: jest.fn().mockReturnValue(filtroVisibilidade),
      effectivePermissions: jest.fn()
    };
    const service = new ProjetoItemQueryService(
      prisma as never,
      authorization as never,
      {} as never
    );

    await expect(service.findOne('item-superior', user)).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.projetoItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'item-superior',
          ...filtroVisibilidade
        })
      })
    );
  });

  it('nega alteração de item atribuído a responsável fora da hierarquia', async () => {
    const prisma = {
      projetoItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'item-superior',
          projetoId: 'projeto-1',
          status: 'ABERTO',
          versao: 1,
          paiId: null,
          inicioPrevistoEm: null,
          fimPrevistoEm: null,
          estimativaMinutos: null,
          responsavelId: 'usuario-gerente',
          arquivadoEm: null
        })
      },
      $transaction: jest.fn()
    };
    const authorization = {
      assertEditContext: jest.fn().mockResolvedValue(contexto),
      escopoHierarquico: jest.fn().mockResolvedValue(escopo),
      assertResponsavelVisivel: jest.fn(() => {
        throw new ForbiddenException('fora do escopo');
      })
    };
    const service = new ProjetoItemCatalogService(
      prisma as never,
      authorization as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(service.update({
      id: 'item-superior',
      versao: 1,
      titulo: 'Tentativa'
    } as never, user)).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
