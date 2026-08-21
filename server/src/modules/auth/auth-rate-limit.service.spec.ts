import { ConfigService } from '@nestjs/config';
import { AuthRateLimitService } from './auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  const configService = {
    get: (key: string) => ({
      AUTH_RATE_LIMIT_MAX_ATTEMPTS: 2,
      AUTH_RATE_LIMIT_WINDOW_SECONDS: 60,
      AUTH_RATE_LIMIT_BLOCK_SECONDS: 120,
      AUTH_RATE_LIMIT_MAX_BUCKETS: 4,
      AUTH_REGISTRATION_MAX_ATTEMPTS: 3,
      AUTH_REGISTRATION_WINDOW_SECONDS: 3600
    } as Record<string, number>)[key]
  } as ConfigService;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bloqueia somente o par identidade e IP depois do limite de falhas', () => {
    const service = new AuthRateLimitService(configService);

    service.recordFailure('usuario@teste.com', '127.0.0.1');
    service.recordFailure('USUARIO@TESTE.COM', '127.0.0.1');

    expect(() => service.assertAllowed(' usuario@teste.com ', '127.0.0.1')).toThrow(
      'Muitas tentativas de autenticacao'
    );
    expect(() => service.assertAllowed(' usuario@teste.com ', '10.0.0.1')).not.toThrow();
  });

  it('remove o bloqueio de identidade apos uma autenticacao valida', () => {
    const service = new AuthRateLimitService(configService);

    service.recordFailure('usuario', '127.0.0.1');
    service.recordFailure('usuario', '127.0.0.1');
    service.recordSuccess('usuario', '127.0.0.1');

    expect(() => service.assertAllowed('usuario', '127.0.0.1')).not.toThrow();
  });

  it('libera novas tentativas depois do tempo de bloqueio', () => {
    const service = new AuthRateLimitService(configService);

    service.recordFailure('usuario', '127.0.0.1');
    service.recordFailure('usuario', '127.0.0.1');
    jest.spyOn(Date, 'now').mockReturnValue(1_121_000);

    expect(() => service.assertAllowed('usuario', '127.0.0.1')).not.toThrow();
  });

  it('limita a cardinalidade e preserva o bucket compartilhado do IP', () => {
    const service = new AuthRateLimitService(configService);

    for (let index = 0; index < 20; index += 1) {
      jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + index);
      service.recordFailure(`identidade-${index}`, '127.0.0.1');
    }

    const attempts = (service as unknown as { attempts: Map<string, unknown> }).attempts;
    expect(attempts.size).toBeLessThanOrEqual(4);
    expect([...attempts.keys()].some((key) => key.startsWith('ip:'))).toBe(true);
  });

  it('mantem o login correto disponivel em outro IP apos ataque ao admin', () => {
    const service = new AuthRateLimitService(configService);

    service.recordFailure('admin', '198.51.100.20');
    service.recordFailure('admin', '198.51.100.20');

    expect(() => service.assertAllowed('admin', '198.51.100.20')).toThrow();
    expect(() => service.assertAllowed('admin', '203.0.113.10')).not.toThrow();
  });

  it('limita cadastros por IP em um bucket separado', () => {
    const service = new AuthRateLimitService(configService);

    service.consumeRegistrationAttempt('127.0.0.1');
    service.consumeRegistrationAttempt('127.0.0.1');
    service.consumeRegistrationAttempt('127.0.0.1');

    expect(() => service.consumeRegistrationAttempt('127.0.0.1')).toThrow(
      'Muitas tentativas de cadastro'
    );
    expect(() => service.consumeRegistrationAttempt('127.0.0.2')).not.toThrow();
  });

  it('libera o cadastro depois da janela configurada', () => {
    const service = new AuthRateLimitService(configService);

    service.consumeRegistrationAttempt('127.0.0.1');
    service.consumeRegistrationAttempt('127.0.0.1');
    service.consumeRegistrationAttempt('127.0.0.1');
    jest.spyOn(Date, 'now').mockReturnValue(4_601_000);

    expect(() => service.consumeRegistrationAttempt('127.0.0.1')).not.toThrow();
  });
});
