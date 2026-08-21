import { RequestHandler } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createOriginValidationMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const normalizedOrigins = new Set(allowedOrigins.map((origin) => origin.trim()).filter(Boolean));

  return (request, response, next) => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      next();
      return;
    }

    const origin = request.get('origin');

    const hasAuthCookie = typeof request.cookies?.access_token === 'string';

    if ((!origin && !hasAuthCookie) || (origin && normalizedOrigins.has(origin))) {
      next();
      return;
    }

    response.status(403).json({
      statusCode: 403,
      message: 'Origem da requisicao nao permitida.'
    });
  };
}
