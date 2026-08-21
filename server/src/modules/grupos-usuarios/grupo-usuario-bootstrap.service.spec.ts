import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { GrupoUsuarioBootstrapService } from './grupo-usuario-bootstrap.service';

describe('GrupoUsuarioBootstrapService security', () => {
  const solutionService = {
    ensureDocumentationSolution: jest.fn().mockResolvedValue(undefined),
    ensureDefaultConfiguradorFeatures: jest.fn().mockResolvedValue(undefined),
    ensureControleChamadosSolution: jest.fn().mockResolvedValue(undefined),
    ensureProjetosSolution: jest.fn().mockResolvedValue(undefined),
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

  it('substitui uma senha legada por segredo configurado e revoga sessoes', async () => {
    const legacyHash = await hash('admin123', 10);
    const update = jest.fn().mockResolvedValue(undefined);
    const prisma: Record<string, any> = {
      grupoUsuario: { count: jest.fn().mockResolvedValue(1) },
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
});
