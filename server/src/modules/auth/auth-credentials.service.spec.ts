import { UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { AuthCredentialsService } from './auth-credentials.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

const compareMock = compare as unknown as jest.Mock;

describe('AuthCredentialsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    compareMock.mockResolvedValue(false);
  });

  it('executa bcrypt dummy quando a identidade nao existe', async () => {
    const usersService = {
      findByLoginOrEmail: jest.fn().mockResolvedValue(null)
    };
    const service = new AuthCredentialsService(usersService as never);

    await expect(service.validateCredentials('inexistente', 'tentativa'))
      .rejects.toBeInstanceOf(UnauthorizedException);

    expect(compareMock).toHaveBeenCalledTimes(1);
    expect(compareMock.mock.calls[0]?.[1]).toMatch(/^\$2b\$10\$/);
  });

  it('usa a mesma mensagem para usuario existente com senha incorreta', async () => {
    const usersService = {
      findByLoginOrEmail: jest.fn().mockResolvedValue({ senhaHash: 'hash-real' })
    };
    const service = new AuthCredentialsService(usersService as never);

    await expect(service.validateCredentials('usuario', 'tentativa'))
      .rejects.toThrow('Credenciais invalidas');
    expect(compareMock).toHaveBeenCalledWith('tentativa', 'hash-real');
  });
});
