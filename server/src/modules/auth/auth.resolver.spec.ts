import { AuthResolver } from './auth.resolver';

describe('AuthResolver', () => {
  const user = { sub: 'usuario-1', empresaId: 'empresa-1' } as never;
  const authenticated = { accessToken: 'token', user: { id: 'usuario-1' } };
  const response = {};
  const service = {
    login: jest.fn(), attachAuthCookie: jest.fn(), findLoginCompanies: jest.fn(),
    logout: jest.fn(), changePassword: jest.fn(), switchCompany: jest.fn(), me: jest.fn()
  };
  const resolver = new AuthResolver(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('autentica pelo IP da requisição e anexa o cookie', async () => {
    service.login.mockResolvedValue(authenticated);
    const context = { req: { ip: '10.0.0.1', socket: {} }, res: response } as never;
    await expect(resolver.login({ loginOrEmail: 'admin', senha: 'senha', empresaId: 1 }, context))
      .resolves.toEqual({ user: authenticated.user });
    expect(service.login).toHaveBeenCalledWith('admin', 'senha', 1, '10.0.0.1');
    expect(service.attachAuthCookie).toHaveBeenCalledWith(response, 'token');
  });

  it('usa o endereço do socket quando o IP não está disponível', () => {
    const companies = [{ id: 'empresa-1' }];
    service.findLoginCompanies.mockReturnValue(companies);
    const context = { req: { ip: '', socket: { remoteAddress: '10.0.0.2' } }, res: response } as never;
    expect(resolver.loginCompanies({ loginOrEmail: 'admin', senha: 'senha' }, context)).toBe(companies);
    expect(service.findLoginCompanies).toHaveBeenCalledWith('admin', 'senha', '10.0.0.2');
  });

  it('encerra a sessão e retorna sucesso', async () => {
    service.logout.mockResolvedValue(undefined);
    await expect(resolver.logout(user, { res: response } as never)).resolves.toBe(true);
    expect(service.logout).toHaveBeenCalledWith('usuario-1', response);
  });

  it('altera a senha, renova o cookie e não expõe o token', async () => {
    service.changePassword.mockResolvedValue(authenticated);
    const promise = resolver.changePassword({ senhaAtual: 'atual', novaSenha: 'nova' }, user, { res: response } as never);
    await expect(promise).resolves.toEqual({ user: authenticated.user });
    expect(service.changePassword).toHaveBeenCalledWith('usuario-1', 'atual', 'nova', 'empresa-1');
    expect(service.attachAuthCookie).toHaveBeenCalledWith(response, 'token');
  });

  it('troca a empresa ativa e renova o cookie', async () => {
    service.switchCompany.mockResolvedValue(authenticated);
    await expect(resolver.switchCompany({ empresaId: 2 }, user, { res: response } as never))
      .resolves.toEqual({ user: authenticated.user });
    expect(service.switchCompany).toHaveBeenCalledWith('usuario-1', 2);
    expect(service.attachAuthCookie).toHaveBeenCalledWith(response, 'token');
  });

  it('delega a consulta do usuário atual', () => {
    service.me.mockReturnValue(authenticated.user);
    expect(resolver.me(user)).toBe(authenticated.user);
    expect(service.me).toHaveBeenCalledWith(user);
  });
});
