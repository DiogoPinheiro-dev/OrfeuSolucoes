import { ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import { GraphQLContext } from '../../../common/types/graphql-context.type';
import { JwtPayload } from '../strategies/jwt-payload.type';
import { assertPasswordChangeCompleted } from './password-change-session.policy';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  // O Nest 12 não herda @Optional() do AuthGuard; sem redeclarar, AuthModuleOptions vira dependência obrigatória.
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);

    if (!authenticated) {
      return false;
    }

    const request = this.getRequest(context);
    assertPasswordChangeCompleted(context, request.user as JwtPayload | undefined);
    return true;
  }

  getRequest(context: ExecutionContext): Request {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphQLContext>().req;
  }
}
