import { BadRequestException } from '@nestjs/common';

export const DEFAULT_COMPANY_STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;

export function readStorageQuotaBytes(
  environmentKey: string,
  fallback = DEFAULT_COMPANY_STORAGE_QUOTA_BYTES
): number {
  const configuredValue = process.env[environmentKey]?.trim();

  if (!configuredValue) {
    return fallback;
  }

  const parsedValue = Number(configuredValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`A variavel ${environmentKey} deve informar uma cota positiva em bytes.`);
  }

  return parsedValue;
}

export function assertStorageQuotaAvailable(
  usedBytes: number,
  incomingBytes: number,
  quotaBytes: number
): void {
  if (usedBytes + incomingBytes > quotaBytes) {
    throw new BadRequestException('A cota de armazenamento de anexos da empresa foi excedida.');
  }
}
