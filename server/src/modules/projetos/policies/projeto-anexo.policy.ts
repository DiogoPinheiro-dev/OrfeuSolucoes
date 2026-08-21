import { assertSafeBufferedUpload } from '../../../common/files/safe-upload.util';
import { ProjetoUploadFile } from '../types/projeto-comunicacao.types';

export const MAX_PROJETO_ANEXO_FILES = 5;
export const MAX_PROJETO_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;

export function validateProjetoAnexoFile(file: ProjetoUploadFile): void {
  assertSafeBufferedUpload(file, MAX_PROJETO_ANEXO_SIZE_BYTES);
}
