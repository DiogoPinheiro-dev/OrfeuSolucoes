import { BadRequestException } from '@nestjs/common';
import { normalizeAndValidatePassword } from './password.policy';

describe('password policy', () => {
  it('normaliza a senha antes de aplicar a politica', () => {
    expect(normalizeAndValidatePassword('  Senha@12345  ')).toBe('Senha@12345');
  });

  it.each([
    'Curta@1',
    'senha@12345',
    'SENHA@12345',
    'SenhaSemNumero!',
    'Senha123456'
  ])('rejeita senha fraca: %s', (password) => {
    expect(() => normalizeAndValidatePassword(password)).toThrow(BadRequestException);
  });

  it('nao permite completar o tamanho minimo apenas com espacos', () => {
    expect(() => normalizeAndValidatePassword('Ab@1234   ')).toThrow(BadRequestException);
  });

  it('rejeita senha acima do limite de 72 bytes efetivamente suportado pelo bcrypt', () => {
    const password = `Ab1!${'é'.repeat(68)}`;

    expect(password).toHaveLength(72);
    expect(Buffer.byteLength(password, 'utf8')).toBeGreaterThan(72);
    expect(() => normalizeAndValidatePassword(password)).toThrow(BadRequestException);
  });
});
