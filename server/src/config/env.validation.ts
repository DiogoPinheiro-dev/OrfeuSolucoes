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

export const validateEnv = (config: RawConfig): RawConfig => {
  const databaseUrl = requiredStringKey(config, 'DATABASE_URL');
  const jwtSecret = requiredStringKey(config, 'JWT_SECRET');
  const corsOrigin = requiredStringKey(config, 'CORS_ORIGIN');
  const port = numericKeyWithDefault(config, 'PORT', 3001);
  const jwtExpiresIn = numericKeyWithDefault(config, 'JWT_EXPIRES_IN', 8 * 60 * 60);
  const nodeEnv = (config.NODE_ENV as string | undefined) ?? 'development';

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    CORS_ORIGIN: corsOrigin,
    PORT: port,
    JWT_EXPIRES_IN: jwtExpiresIn,
    NODE_ENV: nodeEnv
  };
};
