import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService security flows', () => {
  function buildService(userOverrides: Record<string, unknown> = {}) {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'usuario@teste.com',
      login: 'usuario',
      senhaHash: 'hash',
      deveAlterarSenha: false,
      sessaoVersao: 0,
      padraoSistema: false,
      ...userOverrides
    };
    const usersService = {
      findById: jest.fn().mockResolvedValue(user),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      revokeSessions: jest.fn().mockResolvedValue(undefined)
    };
    const empresasService = {
      userBelongsToCompany: jest.fn().mockResolvedValue(true),
      findByUserId: jest.fn().mockResolvedValue([])
    };
    const authCookie = {
      attachAuthCookie: jest.fn(),
      clearAuthCookie: jest.fn()
    };
    const authCredentials = {
      validateCredentials: jest.fn().mockResolvedValue(user),
      assertCurrentPassword: jest.fn().mockResolvedValue(undefined),
      isCurrentPassword: jest.fn().mockResolvedValue(false)
    };
    const authSession = {
      buildAuthPayload: jest.fn().mockResolvedValue({
        accessToken: 'token',
        user: { id: user.id }
      })
    };
    const authRateLimit = {
      assertAllowed: jest.fn(),
      recordFailure: jest.fn(),
      recordSuccess: jest.fn()
    };
    const service = new AuthService(
      usersService as never,
      empresasService as never,
      authCookie as never,
      authCredentials as never,
      authSession as never,
      authRateLimit as never
    );

    return {
      service,
      usersService,
      authCookie,
      authCredentials,
      authRateLimit
    };
  }

  it('exige a senha atual fora do fluxo temporario', async () => {
    const { service, usersService } = buildService();

    await expect(
      service.changePassword(
        '11111111-1111-4111-8111-111111111111',
        undefined,
        'NovaSenha@123'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersService.updatePassword).not.toHaveBeenCalled();
  });

  it('valida a senha atual e revoga sessoes ao trocar uma senha definitiva', async () => {
    const { service, authCredentials, usersService } = buildService();

    await service.changePassword(
      '11111111-1111-4111-8111-111111111111',
      'SenhaAtual@123',
      'NovaSenha@123'
    );

    expect(authCredentials.assertCurrentPassword).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'SenhaAtual@123'
    );
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'NovaSenha@123',
      false
    );
  });

  it('permite primeiro acesso sem repetir a senha temporaria', async () => {
    const { service, authCredentials, usersService } = buildService({ deveAlterarSenha: true });

    await service.changePassword(
      '11111111-1111-4111-8111-111111111111',
      undefined,
      'NovaSenha@123'
    );

    expect(authCredentials.assertCurrentPassword).not.toHaveBeenCalled();
    expect(usersService.updatePassword).toHaveBeenCalled();
  });

  it('revoga a versao da sessao antes de limpar o cookie no logout', async () => {
    const { service, usersService, authCookie } = buildService();
    const response = {} as never;

    await service.logout('11111111-1111-4111-8111-111111111111', response);

    expect(usersService.revokeSessions).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111'
    );
    expect(authCookie.clearAuthCookie).toHaveBeenCalledWith(response);
  });

  it('contabiliza falha de credencial sem distinguir usuario inexistente', async () => {
    const { service, authCredentials, authRateLimit } = buildService();
    authCredentials.validateCredentials.mockRejectedValue(
      new UnauthorizedException('Credenciais invalidas.')
    );

    await expect(service.login('desconhecido', 'senha', undefined, '127.0.0.1'))
      .rejects.toThrow('Credenciais invalidas');
    expect(authRateLimit.recordFailure).toHaveBeenCalledWith(
      'desconhecido',
      '127.0.0.1'
    );
  });
});
