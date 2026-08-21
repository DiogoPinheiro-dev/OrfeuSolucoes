import { UserLookupService } from './user-lookup.service';

describe('UserLookupService identifier namespace', () => {
  function buildService() {
    const usuario = {
      findUnique: jest.fn().mockResolvedValue({ id: 'por-email' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'por-login' })
    };
    return {
      service: new UserLookupService({ usuario } as never),
      usuario
    };
  }

  it('resolve identificadores com @ exclusivamente como e-mail', async () => {
    const { service, usuario } = buildService();

    await expect(service.findByLoginOrEmail(' USUARIO@TESTE.COM ')).resolves.toEqual({ id: 'por-email' });
    expect(usuario.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'usuario@teste.com' }
    }));
    expect(usuario.findFirst).not.toHaveBeenCalled();
  });

  it('resolve identificadores sem @ exclusivamente como login', async () => {
    const { service, usuario } = buildService();

    await expect(service.findByLoginOrEmail(' Usuario.Teste ')).resolves.toEqual({ id: 'por-login' });
    expect(usuario.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { login: 'usuario.teste' }
    }));
    expect(usuario.findUnique).not.toHaveBeenCalled();
  });
});
