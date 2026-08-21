import { ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService administrative creation', () => {
  const input = {
    email: 'novo@teste.com',
    senha: 'Senha@12345'
  };

  function buildService() {
    const userCatalog = {
      create: jest.fn().mockResolvedValue({ id: 'usuario' }),
      register: jest.fn().mockResolvedValue({ id: 'cadastrado' })
    };
    const rateLimit = {
      consumeRegistrationAttempt: jest.fn()
    };
    const service = new UsersService(userCatalog as never, {} as never, {} as never, rateLimit as never);
    return { service, userCatalog, rateLimit };
  }

  it('rejeita criacao solicitada por usuario comum', () => {
    const { service, userCatalog } = buildService();

    expect(() => service.createAsAdmin(input, {
      sub: 'usuario-comum',
      email: 'comum@teste.com',
      padraoSistema: false
    })).toThrow(ForbiddenException);
    expect(userCatalog.create).not.toHaveBeenCalled();
  });

  it('permite criacao ao administrador inicial identificado no estado da sessao', async () => {
    const { service, userCatalog } = buildService();

    await service.createAsAdmin(input, {
      sub: 'admin',
      email: 'admin@teste.com',
      padraoSistema: true
    });

    expect(userCatalog.create).toHaveBeenCalledWith(input);
  });

  it('limita e delega o autocadastro sem elevar privilegios', async () => {
    const { service, userCatalog, rateLimit } = buildService();
    const registration = {
      nome: 'Novo usuario',
      login: 'novo.usuario',
      email: 'novo@teste.com',
      senha: 'Senha@12345'
    };

    await service.register(registration, '127.0.0.1');

    expect(rateLimit.consumeRegistrationAttempt).toHaveBeenCalledWith('127.0.0.1');
    expect(userCatalog.register).toHaveBeenCalledWith(registration);
  });
});
