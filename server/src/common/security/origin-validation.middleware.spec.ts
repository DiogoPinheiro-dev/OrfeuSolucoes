import { createOriginValidationMiddleware } from './origin-validation.middleware';

function request(method: string, origin?: string, accessToken?: string) {
  return {
    method,
    get: jest.fn().mockReturnValue(origin),
    cookies: accessToken ? { access_token: accessToken } : {}
  } as never;
}

function response() {
  const value = {
    status: jest.fn(),
    json: jest.fn()
  };
  value.status.mockReturnValue(value);
  return value;
}

describe('createOriginValidationMiddleware', () => {
  const middleware = createOriginValidationMiddleware(['https://app.orfeu.test']);

  it('permite metodos seguros e clientes de servidor sem cookie e sem Origin', () => {
    const next = jest.fn();

    middleware(request('GET', 'https://hostil.test'), response() as never, next);
    middleware(request('POST'), response() as never, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('rejeita operacao mutavel autenticada por cookie sem cabecalho Origin', () => {
    const next = jest.fn();
    const res = response();

    middleware(request('POST', undefined, 'token'), res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('permite origem configurada em operacao mutavel', () => {
    const next = jest.fn();

    middleware(request('POST', 'https://app.orfeu.test'), response() as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejeita origem nao configurada em operacao mutavel', () => {
    const next = jest.fn();
    const res = response();

    middleware(request('DELETE', 'https://hostil.test'), res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
