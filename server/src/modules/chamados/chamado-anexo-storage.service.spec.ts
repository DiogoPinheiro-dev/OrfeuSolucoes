import { BadRequestException } from '@nestjs/common';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, normalize } from 'node:path';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';

describe('ChamadoAnexoStorageService', () => {
  const originalUploadDirectory = process.env.CHAMADOS_UPLOAD_DIR;
  let uploadDirectory: string;
  let service: ChamadoAnexoStorageService;

  beforeEach(async () => {
    uploadDirectory = await mkdtemp(join(tmpdir(), 'orfeu-chamado-storage-'));
    process.env.CHAMADOS_UPLOAD_DIR = uploadDirectory;
    service = new ChamadoAnexoStorageService();
  });

  afterEach(async () => {
    await rm(uploadDirectory, { recursive: true, force: true });

    if (originalUploadDirectory === undefined) {
      delete process.env.CHAMADOS_UPLOAD_DIR;
    } else {
      process.env.CHAMADOS_UPLOAD_DIR = originalUploadDirectory;
    }
  });

  it('resolve somente caminhos relativos contidos na raiz de uploads', () => {
    const resolved = service.resolve(join('chamados', 'chamado-1', 'arquivo.txt'));

    expect(resolved).toBe(normalize(join(uploadDirectory, 'chamados', 'chamado-1', 'arquivo.txt')));
    expect(isAbsolute(resolved)).toBe(true);
  });

  it('rejeita caminho vazio, absoluto e travessia para diretorio irmao', () => {
    const siblingEscape = join('..', `${basename(uploadDirectory)}-fora`, 'arquivo.txt');

    expect(() => service.resolve('')).toThrow(BadRequestException);
    expect(() => service.resolve(join(uploadDirectory, 'arquivo.txt'))).toThrow(BadRequestException);
    expect(() => service.resolve(siblingEscape)).toThrow(BadRequestException);
  });

  it('salva e remove o arquivo usando apenas o caminho relativo retornado', async () => {
    const content = Buffer.from('conteudo seguro');
    const saved = await service.save('chamado-1', {
      originalname: 'evidencia.txt',
      buffer: content,
      mimetype: 'text/plain',
      size: content.length
    });
    const absolutePath = service.resolve(saved.caminho);

    await expect(access(absolutePath)).resolves.toBeUndefined();
    await service.remove(saved.caminho);
    await expect(access(absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
