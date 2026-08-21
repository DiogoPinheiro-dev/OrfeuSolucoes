import { BadRequestException } from '@nestjs/common';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_MAX_BYTES = 72;

const FORBIDDEN_PASSWORDS = new Set([
  'admin',
  'admin123',
  'password',
  'password123',
  'senha',
  'senha123'
]);

const PASSWORD_POLICY_MESSAGE =
  `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres, ` +
  `usar no maximo ${PASSWORD_MAX_BYTES} bytes em UTF-8 e conter letra maiuscula, ` +
  'letra minuscula, numero e caractere especial.';

export function normalizeAndValidatePassword(rawPassword: string): string {
  const password = rawPassword.trim();
  const hasRequiredLength =
    password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  const hasSupportedByteLength = Buffer.byteLength(password, 'utf8') <= PASSWORD_MAX_BYTES;
  const hasRequiredCharacters =
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!hasRequiredLength || !hasSupportedByteLength || !hasRequiredCharacters) {
    throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
  }

  if (FORBIDDEN_PASSWORDS.has(password.toLowerCase())) {
    throw new BadRequestException('Escolha uma senha diferente das credenciais temporarias conhecidas.');
  }

  return password;
}
