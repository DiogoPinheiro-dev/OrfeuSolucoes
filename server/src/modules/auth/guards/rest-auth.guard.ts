import { ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../strategies/jwt-payload.type';
import { assertPasswordChangeCompleted } from './password-change-session.policy';

@Injectable()
export class RestAuthGuard extends AuthGuard('jwt') {
  // O Nest 12 não herda @Optional() do AuthGuard; sem redeclarar, AuthModuleOptions vira dependência obrigatória.
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);

    if (!authenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest<Request>();
    assertPasswordChangeCompleted(context, request.user as JwtPayload | undefined);
    return true;
  }
}
