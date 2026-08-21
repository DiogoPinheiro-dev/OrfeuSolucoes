import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';

export type BufferedUpload = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

const EXPECTED_MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain'
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PDF_SIGNATURE = Buffer.from('%PDF-', 'ascii');
const ZIP_SIGNATURES = [
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from([0x50, 0x4b, 0x05, 0x06]),
  Buffer.from([0x50, 0x4b, 0x07, 0x08])
];

export function isDeclaredUploadTypeAllowed(originalname: string, mimetype: string): boolean {
  const extension = extname(originalname || '').toLowerCase();
  return EXPECTED_MIME_BY_EXTENSION[extension] === mimetype;
}

export function assertSafeBufferedUpload(file: BufferedUpload, maxSizeBytes: number): void {
  const originalname = file?.originalname?.trim() || '';

  if (!isSafeOriginalName(originalname)) {
    throw new BadRequestException('Nome de arquivo invalido para anexo.');
  }

  if (!file?.buffer?.length || !file.size || file.size !== file.buffer.length) {
    throw new BadRequestException('Arquivo de anexo vazio ou invalido.');
  }

  if (file.size > maxSizeBytes) {
    throw new BadRequestException('Cada anexo deve ter no maximo 10 MB.');
  }

  if (!isDeclaredUploadTypeAllowed(originalname, file.mimetype) || !matchesFileContent(file)) {
    throw new BadRequestException('Tipo de arquivo nao permitido para anexo.');
  }
}

function isSafeOriginalName(originalname: string): boolean {
  return !!originalname &&
    originalname.length <= 255 &&
    !originalname.includes('..') &&
    !/[\\/\u0000-\u001f]/.test(originalname);
}

function matchesFileContent(file: BufferedUpload): boolean {
  const extension = extname(file.originalname).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return file.buffer.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE);
    case '.png':
      return file.buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
    case '.pdf':
      return file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
    case '.docx':
      return ZIP_SIGNATURES.some((signature) => file.buffer.subarray(0, signature.length).equals(signature)) &&
        file.buffer.includes(Buffer.from('[Content_Types].xml')) &&
        file.buffer.includes(Buffer.from('word/'));
    case '.txt': {
      if (file.buffer.includes(0)) {
        return false;
      }
      return !file.buffer.toString('utf8').includes('\ufffd');
    }
    default:
      return false;
  }
}
