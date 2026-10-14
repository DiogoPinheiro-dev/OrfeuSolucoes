import { ChamadoGoogleEmailService } from './chamado-google-email.service';

const config = {
  get: (key: string) => ({
    JWT_SECRET: 'segredo-de-teste',
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
    GOOGLE_TOKEN_ENCRYPTION_KEY: 'chave-de-teste'
  } as Record<string, string>)[key]
};

const respostaJson = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

const montar = () => {
  const prisma = {
    chamado: { findUnique: jest.fn() },
    googleEmailConta: { findFirst: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) }
  };
  const service = new ChamadoGoogleEmailService(prisma as any, config as any, {} as any);
  const tokenGuardado = (service as any).encrypt('refresh-token') as string;
  prisma.chamado.findUnique.mockResolvedValue({
    id: 'c1',
    empresaId: 4,
    solicitante: { nome: 'Solicitante', email: 'solicitante@orfeu.test' },
    responsavel: null,
    liderAtendimento: null,
    acompanhantes: [],
    responsavelGrupo: null
  });
  prisma.googleEmailConta.findFirst.mockResolvedValue({
    id: 7,
    empresaId: 4,
    emailGoogle: 'avisos@orfeu.test',
    refreshTokenCriptografado: tokenGuardado,
    conectadoEm: new Date('2026-10-07T10:00:00Z'),
    ativo: true,
    principal: true
  });
  jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);
  return { prisma, service, tokenGuardado };
};

describe('ChamadoGoogleEmailService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('desconecta a conta quando a Google responde que a autorizacao venceu ou foi revogada', async () => {
    const { prisma, service, tokenGuardado } = montar();
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, 400));

    await service.sendChamadoUpdate('c1', 'Chamado atualizado', 'O chamado recebeu uma resposta.');

    expect(prisma.googleEmailConta.updateMany).toHaveBeenCalledWith({
      where: { id: 7, refreshTokenCriptografado: tokenGuardado },
      data: { refreshTokenCriptografado: null }
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((service as any).logger.warn).toHaveBeenCalledWith(expect.stringContaining('Conta Google 7 desconectada'));
  });

  it('nao registra desconexao quando outra reconexao ja trocou o token', async () => {
    const { prisma, service } = montar();
    prisma.googleEmailConta.updateMany.mockResolvedValue({ count: 0 });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson({ error: 'invalid_grant' }, 400));

    await service.sendChamadoUpdate('c1', 'Chamado atualizado', 'O chamado recebeu uma resposta.');

    expect(prisma.googleEmailConta.updateMany).toHaveBeenCalledTimes(1);
    expect((service as any).logger.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['instabilidade da Google', () => respostaJson({ error: 'internal_failure' }, 503)],
    ['credencial do app recusada', () => respostaJson({ error: 'invalid_client', error_description: 'The OAuth client was not found.' }, 401)]
  ])('mantem a conexao quando a renovacao falha por %s', async (_caso, resposta) => {
    const { prisma, service } = montar();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(resposta());

    await service.sendChamadoUpdate('c1', 'Chamado atualizado', 'O chamado recebeu uma resposta.');

    expect(prisma.googleEmailConta.updateMany).not.toHaveBeenCalled();
    expect((service as any).logger.error).toHaveBeenCalledWith(expect.stringContaining('c1'), expect.any(String));
  });

  it('mantem a conexao quando a rede falha antes da resposta da Google', async () => {
    const { prisma, service } = montar();
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    await service.sendChamadoUpdate('c1', 'Chamado atualizado', 'O chamado recebeu uma resposta.');

    expect(prisma.googleEmailConta.updateMany).not.toHaveBeenCalled();
  });
});
