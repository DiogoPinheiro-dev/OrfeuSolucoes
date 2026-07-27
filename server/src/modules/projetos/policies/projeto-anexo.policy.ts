import { BadRequestException } from '@nestjs/common';
import { basename, extname } from 'node:path';
import { ProjetoUploadFile } from '../types/projeto-comunicacao.types';

export const MAX_PROJETO_ANEXO_FILES = 5;
export const MAX_PROJETO_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_PROJETO_ANEXO_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);
export const ALLOWED_PROJETO_ANEXO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.txt']);

export function validateProjetoAnexoFile(file: ProjetoUploadFile): void {
  const original = file?.originalname?.trim() || '';
  const extension = extname(original).toLowerCase();
  if (!original || original.length > 255 || basename(original) !== original || original.includes('..')) {
    throw new BadRequestException('Nome de arquivo invalido para anexo.');
  }
  if (!file?.buffer?.length || !file.size) throw new BadRequestException('Arquivo de anexo vazio ou invalido.');
  if (file.size > MAX_PROJETO_ANEXO_SIZE_BYTES) throw new BadRequestException('Cada anexo deve ter no maximo 10 MB.');
  if (!ALLOWED_PROJETO_ANEXO_MIME_TYPES.has(file.mimetype) || !ALLOWED_PROJETO_ANEXO_EXTENSIONS.has(extension)) {
    throw new BadRequestException('Tipo de arquivo nao permitido para anexo.');
  }
}