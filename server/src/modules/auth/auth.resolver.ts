import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from '../../common/types/graphql-context.type';
import { UserType } from '../users/dto/user.type';
import { EmpresaType } from '../empresas/dto/empresa.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthPayloadType } from './dto/auth-payload.type';
import { ChangePasswordInput } from './dto/change-password.input';
import { LoginCompaniesInput } from './dto/login-companies.input';
import { LoginInput } from './dto/login.input';
import { SwitchCompanyInput } from './dto/switch-company.input';
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
    const result = await this.authService.login(input.loginOrEmail, input.senha, input.empresaId);
    this.authService.attachAuthCookie(context.res, result.accessToken);
    return result;
  }

  @Mutation(() => [EmpresaType])
  loginCompanies(@Args('input') input: LoginCompaniesInput): Promise<EmpresaType[]> {
    return this.authService.findLoginCompanies(input.loginOrEmail, input.senha);
  }

  @Mutation(() => Boolean)
  logout(@Context() context: GraphQLContext): boolean {
    this.authService.clearAuthCookie(context.res);
    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => AuthPayloadType)
  changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUser() user: JwtPayload,
    @Context() context: GraphQLContext
  ): Promise<AuthPayloadType> {
    return this.authService.changePassword(user.sub, input.novaSenha, user.empresaId).then((result) => {
      this.authService.attachAuthCookie(context.res, result.accessToken);
      return result;
    });
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => AuthPayloadType)
  switchCompany(
    @Args('input') input: SwitchCompanyInput,
    @CurrentUser() user: JwtPayload,
    @Context() context: GraphQLContext
  ): Promise<AuthPayloadType> {
    return this.authService.switchCompany(user.sub, input.empresaId).then((result) => {
      this.authService.attachAuthCookie(context.res, result.accessToken);
      return result;
    });
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  me(@CurrentUser() user: JwtPayload): Promise<UserType> {
    return this.authService.me(user);
  }
}
