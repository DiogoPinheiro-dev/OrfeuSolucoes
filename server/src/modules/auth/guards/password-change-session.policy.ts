import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '../strategies/jwt-payload.type';
import { ALLOW_PASSWORD_CHANGE_SESSION } from '../decorators/allow-password-change-session.decorator';

export function assertPasswordChangeCompleted(
  context: ExecutionContext,
  user?: JwtPayload
): void {
  if (!user?.deveAlterarSenha) {
    return;
  }

  const handlerAllowed = Reflect.getMetadata(
    ALLOW_PASSWORD_CHANGE_SESSION,
    context.getHandler()
  );
  const controllerAllowed = Reflect.getMetadata(
    ALLOW_PASSWORD_CHANGE_SESSION,
    context.getClass()
  );

  if (handlerAllowed || controllerAllowed) {
    return;
  }

  throw new ForbiddenException('Altere a senha temporaria antes de continuar.');
}
