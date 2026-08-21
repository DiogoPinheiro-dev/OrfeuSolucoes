import { validateEnv } from './env.validation';

const baseConfig = {
  NODE_ENV: 'development',
  DATABASE_URL: 'sqlserver://localhost:1433;database=orfeu',
  JWT_SECRET: 'jwt-secret-for-tests',
  GOOGLE_TOKEN_ENCRYPTION_KEY: 'google-encryption-secret-for-tests',
  CORS_ORIGIN: 'http://localhost:5173'
};

describe('validateEnv', () => {
  it('deriva emissor e audiencia distintos por ambiente', () => {
    const result = validateEnv({
      ...baseConfig,
      NODE_ENV: 'production',
      APP_ENV: 'homologation',
      JWT_SECRET: 'jwt-secret-for-homologation-2026-safe',
      GOOGLE_TOKEN_ENCRYPTION_KEY: 'google-token-encryption-key-hml-2026-safe'
    });

    expect(result.JWT_ISSUER).toBe('orfeu-solucoes-homologation');
    expect(result.JWT_AUDIENCE).toBe('orfeu-app-homologation');
    expect(result.TRUST_PROXY).toEqual(['loopback']);
  });

  it('rejeita NODE_ENV ausente ou desconhecido', () => {
    const { NODE_ENV: _nodeEnv, ...withoutNodeEnv } = baseConfig;

    expect(() => validateEnv(withoutNodeEnv)).toThrow('NODE_ENV');
    expect(() => validateEnv({ ...baseConfig, NODE_ENV: 'homologation' })).toThrow('NODE_ENV');
  });

  it('exige APP_ENV e segredos fortes no runtime remoto', () => {
    expect(() => validateEnv({ ...baseConfig, NODE_ENV: 'production' })).toThrow('APP_ENV');
    expect(() => validateEnv({
      ...baseConfig,
      NODE_ENV: 'production',
      APP_ENV: 'production'
    })).toThrow('at least 32 characters');
  });

  it('rejeita APP_ENV remoto quando NODE_ENV nao ativa o hardening de producao', () => {
    expect(() => validateEnv({
      ...baseConfig,
      APP_ENV: 'homologation'
    })).toThrow('require NODE_ENV=production');
    expect(() => validateEnv({
      ...baseConfig,
      APP_ENV: 'production'
    })).toThrow('require NODE_ENV=production');
    expect(() => validateEnv({
      ...baseConfig,
      NODE_ENV: 'production',
      APP_ENV: 'development'
    })).toThrow('local NODE_ENV and APP_ENV values must match');
  });

  it('rejeita a reutilizacao da chave JWT na criptografia de tokens Google', () => {
    expect(() => validateEnv({
      ...baseConfig,
      GOOGLE_TOKEN_ENCRYPTION_KEY: baseConfig.JWT_SECRET
    })).toThrow('must use different secrets');
  });

  it('valida limites positivos para tentativas de autenticacao', () => {
    expect(() => validateEnv({
      ...baseConfig,
      AUTH_RATE_LIMIT_MAX_ATTEMPTS: 0
    })).toThrow('AUTH_RATE_LIMIT_MAX_ATTEMPTS');

    expect(() => validateEnv({
      ...baseConfig,
      AUTH_REGISTRATION_WINDOW_SECONDS: 0
    })).toThrow('AUTH_REGISTRATION_WINDOW_SECONDS');
  });

  it('aceita apenas proxies explicitos e rejeita configuracoes amplas', () => {
    expect(validateEnv({
      ...baseConfig,
      TRUST_PROXY: '127.0.0.1, 10.0.0.0/24, ::1'
    }).TRUST_PROXY).toEqual(['127.0.0.1', '10.0.0.0/24', '::1']);
    expect(() => validateEnv({ ...baseConfig, TRUST_PROXY: 'true' })).toThrow('TRUST_PROXY');
    expect(() => validateEnv({ ...baseConfig, TRUST_PROXY: '*' })).toThrow('TRUST_PROXY');
    expect(() => validateEnv({ ...baseConfig, TRUST_PROXY: '1' })).toThrow('TRUST_PROXY');
  });
});
