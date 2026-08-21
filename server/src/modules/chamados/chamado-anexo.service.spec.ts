import { BadRequestException } from '@nestjs/common';
import { ChamadoAnexoService } from './chamado-anexo.service';

describe('ChamadoAnexoService', () => {
  const originalQuota = process.env.CHAMADOS_STORAGE_QUOTA_BYTES_PER_COMPANY;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalQuota === undefined) {
      delete process.env.CHAMADOS_STORAGE_QUOTA_BYTES_PER_COMPANY;
    } else {
      process.env.CHAMADOS_STORAGE_QUOTA_BYTES_PER_COMPANY = originalQuota;
    }
  });

  it('remove o arquivo salvo quando a gravacao dos metadados falha', async () => {
    process.env.CHAMADOS_STORAGE_QUOTA_BYTES_PER_COMPANY = '1000';
    const databaseFailure = new Error('falha ao gravar metadados');
    const { service, prisma, storage, file, user } = createSubject();
    prisma.chamadoAnexo.create.mockRejectedValue(databaseFailure);

    await expect(service.adicionarAnexos('chamado-1', [file], user)).rejects.toBe(databaseFailure);

    expect(storage.remove).toHaveBeenCalledWith('chamados/chamado-1/arquivo.txt');
    expect(prisma.chamado.update).not.toHaveBeenCalled();
  });

  it('rejeita o lote antes de salvar quando a cota da empresa seria excedida', async () => {
    process.env.CHAMADOS_STORAGE_QUOTA_BYTES_PER_COMPANY = '20';
    const { service, prisma, storage, file, user } = createSubject();
    prisma.chamadoAnexo.aggregate.mockResolvedValue({ _sum: { tamanho: 10 } });

    await expect(service.adicionarAnexos('chamado-1', [file], user))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(storage.save).not.toHaveBeenCalled();
    expect(prisma.chamadoAnexo.create).not.toHaveBeenCalled();
  });
});

function createSubject() {
  const buffer = Buffer.from('conteudo seguro');
  const file = {
    originalname: 'arquivo.txt',
    buffer,
    mimetype: 'text/plain',
    size: buffer.length
  };
  const prisma = {
    chamadoAnexo: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { tamanho: 0 } }),
      create: jest.fn()
    },
    chamado: { update: jest.fn() },
    chamadoHistorico: { create: jest.fn() }
  };
  const storage = {
    save: jest.fn().mockResolvedValue({
      nomeOriginal: file.originalname,
      nomeArquivo: 'arquivo.txt',
      caminho: 'chamados/chamado-1/arquivo.txt',
      mimeType: file.mimetype,
      tamanho: file.size
    }),
    remove: jest.fn().mockResolvedValue(undefined),
    resolve: jest.fn()
  };
  const chamadoQuery = {
    findChamadoRecordOrThrow: jest.fn().mockResolvedValue({ id: 'chamado-1', status: 'ABERTO' })
  };
  const authorization = {
    assertCompanyContext: jest.fn().mockReturnValue(1),
    assertCanAttachFiles: jest.fn().mockResolvedValue(undefined)
  };
  const service = new ChamadoAnexoService(
    prisma as never,
    storage as never,
    chamadoQuery as never,
    authorization as never
  );
  const user = { sub: 'usuario-1', email: 'usuario@orfeu.test', empresaId: 1 };

  return { service, prisma, storage, file, user };
}
