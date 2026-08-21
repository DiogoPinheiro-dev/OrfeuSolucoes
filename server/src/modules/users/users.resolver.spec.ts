import { GUARDS_METADATA } from '@nestjs/common/constants';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UsersResolver } from './users.resolver';

describe('UsersResolver security', () => {
  it('protege createUser com autenticacao GraphQL', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      UsersResolver.prototype.createUser
    ) ?? [];

    expect(guards).toContain(GqlAuthGuard);
  });

  it('nao delega criacao anonima ou de usuario comum', () => {
    const usersService = {
      createAsAdmin: jest.fn()
    };
    const resolver = new UsersResolver(usersService as never);

    expect(() => resolver.createUser({
      email: 'novo@teste.com',
      senha: 'Senha@12345'
    }, {
      sub: 'usuario',
      email: 'usuario@teste.com',
      padraoSistema: false
    })).toThrow('Apenas o usuario administrador inicial');
    expect(usersService.createAsAdmin).not.toHaveBeenCalled();
  });

  it('mantem um autocadastro publico separado e repassa o IP do cliente', async () => {
    const usersService = {
      register: jest.fn().mockResolvedValue({ id: 'usuario' })
    };
    const resolver = new UsersResolver(usersService as never);
    const input = {
      email: 'novo@teste.com',
      senha: 'Senha@12345'
    };

    await resolver.registerUser(input, {
      req: {
        ip: '127.0.0.1',
        socket: {}
      }
    } as never);

    expect(usersService.register).toHaveBeenCalledWith(input, '127.0.0.1');
    expect(Reflect.getMetadata(
      GUARDS_METADATA,
      UsersResolver.prototype.registerUser
    ) ?? []).not.toContain(GqlAuthGuard);
  });
});
