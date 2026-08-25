import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { GrupoUsuarioBootstrapService } from './grupo-usuario-bootstrap.service';

describe('GrupoUsuarioBootstrapService security', () => {
  const solutionService = {
    ensureDocumentationSolution: jest.fn().mockResolvedValue(undefined),
    ensureDefaultConfiguradorFeatures: jest.fn().mockResolvedValue(undefined),
    ensureControleChamadosSolution: jest.fn().mockResolvedValue(undefined),
    ensureProjetosSolution: jest.fn().mockResolvedValue(undefined),
    ensureHorasSolutionUnavailable: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockResolvedValue([]),
    syncGroupAccess: jest.fn().mockResolvedValue(undefined)
  };

  function config(initialPassword?: string): ConfigService {
    return {
      get: (key: string) => key === 'INITIAL_ADMIN_PASSWORD' ? initialPassword : undefined
    } as ConfigService;
  }

  it('recusa criar a base com uma credencial previsivel ou ausente', async () => {
    const transaction = jest.fn();
    const prisma: Record<string, any> = {
      grupoUsuario: { count: jest.fn().mockResolvedValue(0) },
      usuario: { count: jest.fn().mockResolvedValue(0) },
      empresa: { count: jest.fn().mockResolvedValue(0) },
      $transaction: transaction
    };

    await expect(
      new GrupoUsuarioBootstrapService(prisma as never, solutionService as never, config())
        .ensureInitialSetup()
    ).rejects.toThrow('INITIAL_ADMIN_PASSWORD');
    await expect(
      new GrupoUsuarioBootstrapService(prisma as never, solutionService as never, config('admin123'))
        .ensureInitialSetup()
    ).rejects.toThrow('A senha deve ter entre');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('cria a descricao inicial do grupo com a acentuacao correta', async () => {
    const createGroup = jest.fn().mockResolvedValue({ id: 1 });
    const prisma: Record<string, any> = {
      grupoUsuario: {
        count: jest.fn().mockResolvedValue(0),
        create: createGroup,
        findFirst: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue(undefined)
      },
      usuario: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' }),
        findFirst: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ grupoId: 1 })
      },
      empresa: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 1 })
      },
      empresaUsuario: { create: jest.fn().mockResolvedValue(undefined) },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) => callback(prisma))
    };

    await new GrupoUsuarioBootstrapService(prisma as never, solutionService as never, config('Admin@Seguro2026!'))
      .ensureInitialSetup();

    expect(createGroup).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        descricao: 'Grupo inicial com acesso a todas as soluções.'
      })
    }));
  });

  it('substitui uma senha legada por segredo configurado e revoga sessoes', async () => {
    const legacyHash = await hash('admin123', 10);
    const update = jest.fn().mockResolvedValue(undefined);
    const prisma: Record<string, any> = {
      grupoUsuario: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue(undefined)
      },
      usuario: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn()
          .mockResolvedValueOnce({
            id: '11111111-1111-4111-8111-111111111111',
            senhaHash: legacyHash,
            deveAlterarSenha: true
          })
          .mockResolvedValueOnce({ grupoId: 1 }),
        update
      },
      empresa: { count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) => callback(prisma))
    };
    const service = new GrupoUsuarioBootstrapService(
      prisma as never,
      solutionService as never,
      config('Admin@Seguro2026!')
    );

    await service.ensureInitialSetup();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        deveAlterarSenha: true,
        sessaoVersao: { increment: 1 }
      })
    }));
    const updatedHash = update.mock.calls[0]?.[0].data.senhaHash as string;
    await expect(compare('Admin@Seguro2026!', updatedHash)).resolves.toBe(true);
    expect(prisma.usuario.findFirst).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { padraoSistema: true }
    }));
  });

  it('continua o bootstrap quando outra instancia vence a criacao inicial', async () => {
    const prisma: Record<string, any> = {
      grupoUsuario: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(undefined)
      },
      usuario: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue(null)
      },
      empresa: { count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn().mockRejectedValue({ code: 'P2002' })
    };
    const service = new GrupoUsuarioBootstrapService(prisma as never, solutionService as never, config());

    await expect(service.ensureInitialSetup()).resolves.toBeUndefined();
    expect(solutionService.ensureControleChamadosSolution).toHaveBeenCalled();
    expect(solutionService.ensureProjetosSolution).toHaveBeenCalled();
    expect(solutionService.ensureHorasSolutionUnavailable).toHaveBeenCalled();
  });

  it('repete a sincronizacao dos acessos do administrador apos conflito concorrente', async () => {
    const prisma: Record<string, any> = {
      grupoUsuario: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue(undefined)
      },
      usuario: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValue({ grupoId: 1 })
      },
      empresa: { count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) => callback(prisma))
    };
    const concurrentSolutionService = {
      ...solutionService,
      findAll: jest.fn().mockResolvedValue([{
        id: 10,
        slug: 'projetos',
        ativo: true,
        somenteAdminSistema: false,
        funcionalidades: [{ id: 11, ativo: true }]
      }]),
      syncGroupAccess: jest.fn()
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValueOnce(undefined)
    };

    await expect(new GrupoUsuarioBootstrapService(prisma as never, concurrentSolutionService as never, config())
      .ensureInitialSetup()).resolves.toBeUndefined();

    expect(concurrentSolutionService.syncGroupAccess).toHaveBeenCalledTimes(3);
  });
});
