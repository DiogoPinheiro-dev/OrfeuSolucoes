import { BadRequestException } from '@nestjs/common';
import { ProjetoComunicacaoService } from './projeto-comunicacao.service';

describe('ProjetoComunicacaoService - anexos', () => {
  const originalQuota = process.env.PROJETOS_STORAGE_QUOTA_BYTES_PER_COMPANY;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalQuota === undefined) {
      delete process.env.PROJETOS_STORAGE_QUOTA_BYTES_PER_COMPANY;
    } else {
      process.env.PROJETOS_STORAGE_QUOTA_BYTES_PER_COMPANY = originalQuota;
    }
  });

  it('remove o arquivo salvo quando a gravacao dos metadados falha', async () => {
    process.env.PROJETOS_STORAGE_QUOTA_BYTES_PER_COMPANY = '1000';
    const databaseFailure = new Error('falha ao gravar metadados');
    const { service, prisma, storage, file, user } = createSubject();
    prisma.projetoAnexo.create.mockRejectedValue(databaseFailure);

    await expect(service.adicionarAnexos('projeto-1', [file], user)).rejects.toBe(databaseFailure);

    expect(storage.remove).toHaveBeenCalledWith('projetos/projeto-1/arquivo.txt');
  });

  it('rejeita o lote antes de salvar quando a cota da empresa seria excedida', async () => {
    process.env.PROJETOS_STORAGE_QUOTA_BYTES_PER_COMPANY = '20';
    const { service, prisma, storage, file, user } = createSubject();
    prisma.projetoAnexo.aggregate.mockResolvedValue({ _sum: { tamanho: 10 } });

    await expect(service.adicionarAnexos('projeto-1', [file], user))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(storage.save).not.toHaveBeenCalled();
    expect(prisma.projetoAnexo.create).not.toHaveBeenCalled();
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
    projetoAnexo: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { tamanho: 0 } }),
      create: jest.fn()
    },
    projetoAtualizacao: { findFirst: jest.fn() },
    projetoComentario: { findFirst: jest.fn() },
    $transaction: jest.fn()
  };
  const authorization = {
    assertReadContext: jest.fn().mockResolvedValue({
      empresaId: 1,
      projeto: { id: 'projeto-1' }
    }),
    assertManageAttachments: jest.fn().mockResolvedValue(undefined)
  };
  const storage = {
    save: jest.fn().mockResolvedValue({
      nomeOriginal: file.originalname,
      nomeArquivo: 'arquivo.txt',
      caminho: 'projetos/projeto-1/arquivo.txt',
      mimeType: file.mimetype,
      tamanho: file.size
    }),
    remove: jest.fn().mockResolvedValue(undefined)
  };
  const service = new ProjetoComunicacaoService(
    prisma as never,
    authorization as never,
    {} as never,
    storage as never,
    {} as never,
    {} as never,
    {
      escopo: jest.fn().mockResolvedValue({ restrito: false, recursoIds: [], usuarioIds: [] }),
      filtroProjetoItem: jest.fn().mockReturnValue({})
    } as never
  );
  const user = { sub: 'usuario-1', email: 'usuario@orfeu.test', empresaId: 1 };

  return { service, prisma, storage, file, user };
}
