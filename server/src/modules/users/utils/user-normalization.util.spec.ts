import { LOGIN_MAX_LENGTH, normalizeLogin } from './user-normalization.util';

describe('user normalization security', () => {
  it('normaliza logins e mantem o namespace separado de e-mails', () => {
    expect(normalizeLogin(' Usuario.Teste ')).toBe('usuario.teste');
    expect(normalizeLogin('')).toBeNull();
    expect(() => normalizeLogin('usuario@teste.com')).toThrow('Login nao pode conter @');
    expect(() => normalizeLogin('a'.repeat(LOGIN_MAX_LENGTH + 1))).toThrow('no maximo');
  });
});
