import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, relative } from 'node:path';
import { ProjetoUploadFile } from './types/projeto-comunicacao.types';

@Injectable()
export class ProjetoAnexoStorageService {
  private readonly uploadRoot = normalize(process.env.PROJETOS_UPLOAD_DIR || join(process.cwd(), 'uploads'));

  async save(projetoId: string, file: ProjetoUploadFile) {
    const nomeArquivo = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const relativePath = join('projetos', projetoId, nomeArquivo);
    const directory = this.resolve(join('projetos', projetoId));
    const absolutePath = this.resolve(relativePath);
    await mkdir(directory, { recursive: true });
    await writeFile(absolutePath, file.buffer);
    return { nomeOriginal: file.originalname.trim(), nomeArquivo, caminho: relativePath.replace(/\\/g, '/'), mimeType: file.mimetype, tamanho: file.size };
  }

  resolve(caminho: string): string {
    if (!caminho || isAbsolute(caminho)) throw new BadRequestException('Caminho de anexo invalido.');
    const resolved = normalize(join(this.uploadRoot, caminho));
    const pathFromRoot = relative(this.uploadRoot, resolved);
    if (!pathFromRoot || pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }
    return resolved;
  }

  async remove(caminho: string): Promise<void> {
    try { await unlink(this.resolve(caminho)); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}