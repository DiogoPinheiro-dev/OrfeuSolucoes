import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, relative, sep } from 'node:path';

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
  private readonly uploadRoot = normalize(process.env.CHAMADOS_UPLOAD_DIR || join(process.cwd(), 'uploads'));

  async save(chamadoId: string, file: UploadedFileLike): Promise<SavedChamadoAnexo> {
    const extension = extname(file.originalname || '').toLowerCase();
    const nomeArquivo = `${randomUUID()}${extension}`;
    const relativePath = join('chamados', chamadoId, nomeArquivo);
    const absoluteDirectory = this.resolve(join('chamados', chamadoId));
    const absolutePath = this.resolve(relativePath);

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
    if (!caminho || isAbsolute(caminho)) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    const resolved = normalize(join(this.uploadRoot, caminho));
    const pathFromRoot = relative(this.uploadRoot, resolved);

    if (
      !pathFromRoot ||
      pathFromRoot === '..' ||
      pathFromRoot.startsWith(`..${sep}`) ||
      isAbsolute(pathFromRoot)
    ) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    return resolved;
  }

  async remove(caminho: string): Promise<void> {
    try {
      await unlink(this.resolve(caminho));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
