import { ForbiddenException } from '@nestjs/common';
import { ALLOW_PASSWORD_CHANGE_SESSION } from '../decorators/allow-password-change-session.decorator';
import { assertPasswordChangeCompleted } from './password-change-session.policy';

describe('password change session policy', () => {
  function context(allowed = false) {
    const handler = () => undefined;
    const controller = class TestController {};

    if (allowed) {
      Reflect.defineMetadata(ALLOW_PASSWORD_CHANGE_SESSION, true, handler);
    }

    return {
      getHandler: () => handler,
      getClass: () => controller
    } as never;
  }

  it('bloqueia operacoes comuns enquanto a senha e temporaria', () => {
    expect(() => assertPasswordChangeCompleted(context(), {
      sub: 'usuario',
      email: 'usuario@teste.com',
      deveAlterarSenha: true
    })).toThrow(ForbiddenException);
  });

  it('libera somente operacoes explicitamente marcadas', () => {
    expect(() => assertPasswordChangeCompleted(context(true), {
      sub: 'usuario',
      email: 'usuario@teste.com',
      deveAlterarSenha: true
    })).not.toThrow();
  });

  it('nao restringe uma sessao com senha definitiva', () => {
    expect(() => assertPasswordChangeCompleted(context(), {
      sub: 'usuario',
      email: 'usuario@teste.com',
      deveAlterarSenha: false
    })).not.toThrow();
  });
});
