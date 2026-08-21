import { validate } from 'class-validator';
import { ChangePasswordInput } from './change-password.input';

describe('ChangePasswordInput', () => {
  const validateInput = (senhaAtual: string, novaSenha = 'NovaSenha@1') =>
    validate(Object.assign(new ChangePasswordInput(), { senhaAtual, novaSenha }));

  it('nao limita a senha atual legada para sempre permitir a rotacao', async () => {
    const errors = await validateInput('A'.repeat(1024));

    expect(errors.find((error) => error.property === 'senhaAtual')).toBeUndefined();
  });

  it('mantem o novo limite de 72 caracteres para a senha substituta', async () => {
    const errors = await validateInput('SenhaAtual@1', `Ab1!${'a'.repeat(69)}`);

    expect(errors.find((error) => error.property === 'novaSenha')).toBeDefined();
  });
});
