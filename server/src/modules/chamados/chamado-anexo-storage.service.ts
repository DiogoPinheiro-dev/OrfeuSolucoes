import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

type UploadedFileLike = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

type SavedChamadoAnexo = {
  nomeOriginal: string;
  nomeArquivo: string;
  caminho: string;
  mimeType: string;
  tamanho: number;
};

@Injectable()
export class ChamadoAnexoStorageService {
  private readonly uploadRoot = process.env.CHAMADOS_UPLOAD_DIR || join(process.cwd(), 'uploads');

  async save(chamadoId: string, file: UploadedFileLike): Promise<SavedChamadoAnexo> {
    const extension = extname(file.originalname || '').toLowerCase();
    const nomeArquivo = `${randomUUID()}${extension}`;
    const relativePath = join('chamados', chamadoId, nomeArquivo);
    const absoluteDirectory = join(this.uploadRoot, 'chamados', chamadoId);
    const absolutePath = join(absoluteDirectory, nomeArquivo);

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      nomeOriginal: file.originalname,
      nomeArquivo,
      caminho: relativePath.replace(/\\/g, '/'),
      mimeType: file.mimetype,
      tamanho: file.size
    };
  }

  resolve(caminho: string): string {
    const resolved = normalize(join(this.uploadRoot, caminho));
    const normalizedRoot = normalize(this.uploadRoot);

    if (!resolved.startsWith(normalizedRoot)) {
      throw new Error('Caminho de anexo inválido.');
    }

    return resolved;
  }
}
