import { ForbiddenException } from '@nestjs/common';
import { ProjetoBacklogService } from './projeto-backlog.service';
import { ProjetoItemAuthorizationService } from './projeto-item-authorization.service';

const user = { sub: 'usuario-atual' } as never;
const contexto = {
  empresaId: 7,
  projeto: { id: 'projeto-1' }
} as never;

describe('Atribuição direta de itens a recursos', () => {
  it('lista somente usuários de recursos ativos vinculados ao projeto', async () => {
    const projetoRecurso = {
      findMany: jest.fn().mockResolvedValue([
        { cadastro: { usuario: { id: 'u2', nome: 'Zoe', login: 'zoe', email: 'zoe@teste.local' } } },
        { cadastro: { usuario: { id: 'u1', nome: 'Ana', login: 'ana', email: 'ana@teste.local' } } }
      ])
    };
    const escopo = { restrito: false, recursoIds: [], usuarioIds: [] };
    const itemAuthorization = {
      assertReadContext: jest.fn().mockResolvedValue(contexto),
      escopoHierarquico: jest.fn().mockResolvedValue(escopo),
      filtroProjetoRecurso: jest.fn().mockReturnValue({})
    };
    const service = new ProjetoBacklogService(
      { projetoRecurso } as never,
      {} as never,
      itemAuthorization as never,
      {} as never
    );

    await expect(service.responsaveis('projeto-1', user)).resolves.toEqual([
      expect.objectContaining({ id: 'u1', nome: 'Ana' }),
      expect.objectContaining({ id: 'u2', nome: 'Zoe' })
    ]);
    expect(projetoRecurso.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        empresaId: 7,
        projetoId: 'projeto-1',
        ativo: true,
        cadastro: { ativo: true }
      }
    }));
    expect(itemAuthorization.escopoHierarquico).toHaveBeenCalledWith(
      user,
      contexto
    );
  });

  it('aceita como responsável somente um recurso ativo do projeto', async () => {
    const projetoRecurso = { findFirst: jest.fn().mockResolvedValue({ id: 'vinculo-1' }) };
    const service = new ProjetoItemAuthorizationService(
      { projetoRecurso } as never,
      {} as never,
      {} as never
    );

    await expect(service.assertResponsavelElegivel(
      { projetoRecurso } as never,
      contexto,
      'usuario-recurso'
    )).resolves.toBeUndefined();
    expect(projetoRecurso.findFirst).toHaveBeenCalledWith({
      where: {
        empresaId: 7,
        projetoId: 'projeto-1',
        ativo: true,
        cadastro: { usuarioId: 'usuario-recurso', ativo: true }
      },
      select: { id: true }
    });
  });

  it('recusa usuário que não seja recurso ativo do projeto', async () => {
    const projetoRecurso = { findFirst: jest.fn().mockResolvedValue(null) };
    const service = new ProjetoItemAuthorizationService(
      { projetoRecurso } as never,
      {} as never,
      {} as never
    );

    await expect(service.assertResponsavelElegivel(
      { projetoRecurso } as never,
      contexto,
      'usuario-sem-recurso'
    )).rejects.toThrow(ForbiddenException);
  });
});
