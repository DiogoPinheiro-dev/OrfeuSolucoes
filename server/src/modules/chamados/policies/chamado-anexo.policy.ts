import { BadRequestException } from '@nestjs/common';
import { assertSafeBufferedUpload } from '../../../common/files/safe-upload.util';
import {
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
  assertSafeBufferedUpload(file, MAX_ANEXO_SIZE_BYTES);
}
