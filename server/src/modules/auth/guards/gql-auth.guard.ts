import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { GraphQLContext } from '../../../common/types/graphql-context.type';
import { JwtPayload } from '../strategies/jwt-payload.type';
import { assertPasswordChangeCompleted } from './password-change-session.policy';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
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
