import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../strategies/jwt-payload.type';
import { assertPasswordChangeCompleted } from './password-change-session.policy';

@Injectable()
export class RestAuthGuard extends AuthGuard('jwt') {
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
