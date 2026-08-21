import { UserCatalogService } from './user-catalog.service';

describe('UserCatalogService public registration', () => {
  it('converte corrida de unicidade em conflito publico generico', async () => {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockRejectedValue({ code: 'P2002' })
      }
    };
    const passwordService = {
      hashPassword: jest.fn().mockResolvedValue('hash')
    };
    const service = new UserCatalogService(
      prisma as never,
      {} as never,
      passwordService as never,
      {} as never
    );

    await expect(service.register({
      email: 'novo@teste.com',
      login: 'novo.usuario',
      senha: 'Senha@12345'
    })).rejects.toThrow('Nao foi possivel concluir o cadastro com os dados informados.');
  });

  it('nao revela se o conflito publico ocorreu no e-mail ou no login', async () => {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({ id: 'existente' }),
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };
    const passwordService = {
      hashPassword: jest.fn().mockResolvedValue('hash')
    };
    const service = new UserCatalogService(prisma as never, {} as never, passwordService as never, {} as never);

    await expect(service.register({
      email: 'existente@teste.com',
      login: 'novo.usuario',
      senha: 'Senha@12345'
    })).rejects.toMatchObject({
      message: 'Nao foi possivel concluir o cadastro com os dados informados.'
    });
    expect(passwordService.hashPassword).toHaveBeenCalledWith('Senha@12345');
  });
});

describe('UserCatalogService membership consistency', () => {
  const current = {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Usuario',
    login: 'usuario',
    email: 'usuario@teste.com',
    senhaHash: 'hash',
    grupoId: null,
    grupo: null,
    deveAlterarSenha: false,
    sessaoVersao: 2,
    padraoSistema: false
  };

  function buildService(options: { createError?: Error } = {}) {
    const tx = {
      usuario: {
        update: jest.fn().mockResolvedValue({ ...current, sessaoVersao: 3 })
      },
      empresaUsuario: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: options.createError
          ? jest.fn().mockRejectedValue(options.createError)
          : jest.fn().mockResolvedValue({ count: 1 })
      }
    };
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn()
      },
      empresaUsuario: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      $transaction: jest.fn(async (callback: (database: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const userEmpresa = {
      attachEmpresas: jest.fn().mockImplementation(async (user) => ({
        ...user,
        empresasVinculadas: []
      }))
    };
    const service = new UserCatalogService(
      prisma as never,
      userEmpresa as never,
      {} as never,
      {} as never
    );

    return { service, prisma, tx };
  }

  it('atualiza usuario, revoga sessoes e substitui vinculos na mesma transacao', async () => {
    const { service, prisma, tx } = buildService();

    await service.update({ id: current.id, empresaIds: [10, 10, 20] });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ sessaoVersao: { increment: 1 } })
    }));
    expect(tx.empresaUsuario.deleteMany).toHaveBeenCalledWith({
      where: { usuarioId: current.id }
    });
    expect(tx.empresaUsuario.createMany).toHaveBeenCalledWith({
      data: [
        { usuarioId: current.id, empresaId: 10 },
        { usuarioId: current.id, empresaId: 20 }
      ]
    });
    expect(prisma.usuario.update).not.toHaveBeenCalled();
    expect(prisma.empresaUsuario.deleteMany).not.toHaveBeenCalled();
  });

  it('propaga falha de vinculo dentro da transacao para permitir rollback integral', async () => {
    const { service, prisma } = buildService({ createError: new Error('falha no vinculo') });

    await expect(service.update({ id: current.id, empresaIds: [10] }))
      .rejects.toThrow('falha no vinculo');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
