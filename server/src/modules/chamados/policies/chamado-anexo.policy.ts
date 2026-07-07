import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';
import {
  ALLOWED_ANEXO_EXTENSIONS,
  ALLOWED_ANEXO_MIME_TYPES,
  MAX_ANEXO_FILES,
  MAX_ANEXO_SIZE_BYTES
} from '../constants/chamado.constants';
import { ChamadoUploadFile } from '../types/chamado-record.types';

export function assertAnexoFilesSelected(files: ChamadoUploadFile[] | null | undefined): asserts files is ChamadoUploadFile[] {
  if (!files?.length) {
    throw new BadRequestException('Selecione ao menos um arquivo para anexar.');
  }
}

export function assertAnexoBatchLimit(files: ChamadoUploadFile[]): void {
  if (files.length > MAX_ANEXO_FILES) {
    throw new BadRequestException(`Informe no maximo ${MAX_ANEXO_FILES} anexos por envio.`);
  }
}

export function validateAnexoFile(file: ChamadoUploadFile): void {
  const extension = extname(file?.originalname || '').toLowerCase();

  if (!file?.buffer?.length || !file.size) {
    throw new BadRequestException('Arquivo de anexo vazio ou invalido.');
  }

  if (file.size > MAX_ANEXO_SIZE_BYTES) {
    throw new BadRequestException('Cada anexo deve ter no maximo 10 MB.');
  }

  if (!ALLOWED_ANEXO_MIME_TYPES.has(file.mimetype) || !ALLOWED_ANEXO_EXTENSIONS.has(extension)) {
    throw new BadRequestException('Tipo de arquivo nao permitido para anexo.');
  }
}
