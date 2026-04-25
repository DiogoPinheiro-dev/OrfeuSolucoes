import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from '../../common/types/graphql-context.type';
import { UserRole } from '../users/dto/user-role.enum';
import { UserType } from '../users/dto/user.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthPayloadType } from './dto/auth-payload.type';
import { LoginInput } from './dto/login.input';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { JwtPayload } from './strategies/jwt-payload.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayloadType)
  async login(
    @Args('input') input: LoginInput,
    @Context() context: GraphQLContext
  ): Promise<AuthPayloadType> {
    const result = await this.authService.login(input.email, input.senha, input.empresaId);
    this.authService.attachAuthCookie(context.res, result.accessToken);
    return result;
  }

  @Mutation(() => Boolean)
  logout(@Context() context: GraphQLContext): boolean {
    this.authService.clearAuthCookie(context.res);
    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  me(@CurrentUser() user: JwtPayload): UserType {
    const tipo = (user.tipo as UserRole) ?? UserRole.USUARIO;
    const availableSolutions =
      user.availableSolutions ??
      (tipo === UserRole.ADMIN
        ? ['ecommerce', 'projetos', 'horas', 'configurador']
        : tipo === UserRole.USUARIO
          ? ['ecommerce']
          : []);

    return {
      id: user.sub,
      email: user.email,
      nome: user.nome ?? null,
      tipo,
      empresa: user.empresaId
        ? {
            id: user.empresaId,
            nome: user.empresaNome ?? null,
            acessoEcommerce: availableSolutions.includes('ecommerce'),
            acessoProjetos: availableSolutions.includes('projetos'),
            acessoHoras: availableSolutions.includes('horas')
          }
        : null,
      availableSolutions
    };
  }
}
