import { isIP } from 'node:net';

type RawConfig = Record<string, unknown>;

const requiredStringKey = (config: RawConfig, key: string): string => {
  const rawValue = config[key];

  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    throw new Error(`Environment variable "${key}" is required.`);
  }

  return rawValue;
};

const numericKeyWithDefault = (
  config: RawConfig,
  key: string,
  defaultValue: number
): number => {
  const rawValue = config[key];
  const valueToParse = rawValue === undefined ? defaultValue : rawValue;
  const parsedValue = Number(valueToParse);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`Environment variable "${key}" must be a positive number.`);
  }

  return parsedValue;
};

const optionalStringKey = (config: RawConfig, key: string): string | undefined => {
  const rawValue = config[key];

  if (rawValue === undefined || rawValue === null) {
    return undefined;
  }

  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    throw new Error(`Environment variable "${key}" must be a non-empty string when provided.`);
  }

  return rawValue.trim();
};

const enumKey = <T extends string>(
  config: RawConfig,
  key: string,
  allowedValues: readonly T[]
): T => {
  const value = requiredStringKey(config, key).trim() as T;

  if (!allowedValues.includes(value)) {
    throw new Error(
      `Environment variable "${key}" must be one of: ${allowedValues.join(', ')}.`
    );
  }

  return value;
};

const trustProxyEntries = (config: RawConfig): string[] => {
  const configuredValue = optionalStringKey(config, 'TRUST_PROXY') ?? 'loopback';
  const entries = configuredValue.split(',').map((entry) => entry.trim()).filter(Boolean);
  const isValidEntry = (entry: string): boolean => {
    if (entry === 'loopback' || isIP(entry) !== 0) {
      return true;
    }

    const [address = '', prefix, ...extra] = entry.split('/');
    const version = isIP(address);
    const parsedPrefix = Number(prefix);
    const maxPrefix = version === 4 ? 32 : version === 6 ? 128 : 0;

    return version !== 0 && extra.length === 0 && prefix !== undefined && Number.isInteger(parsedPrefix)
      && parsedPrefix > 0 && parsedPrefix <= maxPrefix;
  };

  if (entries.length === 0 || entries.some((entry) => !isValidEntry(entry))) {
    throw new Error(
      'Environment variable "TRUST_PROXY" must contain only loopback, exact IPs or CIDR subnets separated by commas.'
    );
  }

  return entries;
};

export const validateEnv = (config: RawConfig): RawConfig => {
  const nodeEnv = enumKey(config, 'NODE_ENV', ['development', 'test', 'production'] as const);
  const databaseUrl = requiredStringKey(config, 'DATABASE_URL');
  const jwtSecret = requiredStringKey(config, 'JWT_SECRET');
  const googleTokenEncryptionKey = requiredStringKey(config, 'GOOGLE_TOKEN_ENCRYPTION_KEY');
  const corsOrigin = requiredStringKey(config, 'CORS_ORIGIN');
  const port = numericKeyWithDefault(config, 'PORT', 3001);
  const jwtExpiresIn = numericKeyWithDefault(config, 'JWT_EXPIRES_IN', 8 * 60 * 60);
  const configuredAppEnv = optionalStringKey(config, 'APP_ENV');
  const trustProxy = trustProxyEntries(config);

  if (nodeEnv === 'production' && !configuredAppEnv) {
    throw new Error('Environment variable "APP_ENV" is required when NODE_ENV is production.');
  }

  const appEnv = configuredAppEnv ?? nodeEnv;
  const allowedAppEnvs = ['development', 'test', 'homologation', 'production'];

  if (!allowedAppEnvs.includes(appEnv)) {
    throw new Error(`Environment variable "APP_ENV" must be one of: ${allowedAppEnvs.join(', ')}.`);
  }

  const validEnvironmentPair = nodeEnv === 'production'
    ? appEnv === 'homologation' || appEnv === 'production'
    : appEnv === nodeEnv;

  if (!validEnvironmentPair) {
    throw new Error(
      'Remote APP_ENV values require NODE_ENV=production; local NODE_ENV and APP_ENV values must match.'
    );
  }

  if (jwtSecret === googleTokenEncryptionKey) {
    throw new Error('JWT_SECRET and GOOGLE_TOKEN_ENCRYPTION_KEY must use different secrets.');
  }

  if (nodeEnv === 'production' && (jwtSecret.length < 32 || googleTokenEncryptionKey.length < 32)) {
    throw new Error('Production secrets must contain at least 32 characters.');
  }

  const jwtIssuer = optionalStringKey(config, 'JWT_ISSUER') ?? `orfeu-solucoes-${appEnv}`;
  const jwtAudience = optionalStringKey(config, 'JWT_AUDIENCE') ?? `orfeu-app-${appEnv}`;
  const authRateLimitMaxAttempts = numericKeyWithDefault(config, 'AUTH_RATE_LIMIT_MAX_ATTEMPTS', 5);
  const authRateLimitWindowSeconds = numericKeyWithDefault(config, 'AUTH_RATE_LIMIT_WINDOW_SECONDS', 15 * 60);
  const authRateLimitBlockSeconds = numericKeyWithDefault(config, 'AUTH_RATE_LIMIT_BLOCK_SECONDS', 15 * 60);
  const authRateLimitMaxBuckets = numericKeyWithDefault(config, 'AUTH_RATE_LIMIT_MAX_BUCKETS', 10_000);
  const authRegistrationMaxAttempts = numericKeyWithDefault(config, 'AUTH_REGISTRATION_MAX_ATTEMPTS', 3);
  const authRegistrationWindowSeconds = numericKeyWithDefault(config, 'AUTH_REGISTRATION_WINDOW_SECONDS', 60 * 60);

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: jwtIssuer,
    JWT_AUDIENCE: jwtAudience,
    CORS_ORIGIN: corsOrigin,
    GOOGLE_TOKEN_ENCRYPTION_KEY: googleTokenEncryptionKey,
    PORT: port,
    JWT_EXPIRES_IN: jwtExpiresIn,
    NODE_ENV: nodeEnv,
    APP_ENV: appEnv,
    TRUST_PROXY: trustProxy,
    INITIAL_ADMIN_PASSWORD: optionalStringKey(config, 'INITIAL_ADMIN_PASSWORD'),
    AUTH_RATE_LIMIT_MAX_ATTEMPTS: authRateLimitMaxAttempts,
    AUTH_RATE_LIMIT_WINDOW_SECONDS: authRateLimitWindowSeconds,
    AUTH_RATE_LIMIT_BLOCK_SECONDS: authRateLimitBlockSeconds,
    AUTH_RATE_LIMIT_MAX_BUCKETS: authRateLimitMaxBuckets,
    AUTH_REGISTRATION_MAX_ATTEMPTS: authRegistrationMaxAttempts,
    AUTH_REGISTRATION_WINDOW_SECONDS: authRegistrationWindowSeconds
  };
};
