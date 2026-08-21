import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from '../../common/types/graphql-context.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateUserInput } from './dto/create-user.input';
import { RegisterUserInput } from './dto/register-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';
import { assertSystemAdmin } from './policies/user.policy';
import { UsersService } from './users.service';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserType)
  createUser(
    @Args('input') input: CreateUserInput,
    @CurrentUser() user: JwtPayload
  ): Promise<UserType> {
    assertSystemAdmin(user);
    return this.usersService.createAsAdmin(input, user);
  }

  @Mutation(() => UserType)
  registerUser(
    @Args('input') input: RegisterUserInput,
    @Context() context: GraphQLContext
  ): Promise<UserType> {
    return this.usersService.register(
      input,
      context.req.ip || context.req.socket?.remoteAddress
    );
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserType])
  users(@CurrentUser() user: JwtPayload): Promise<UserType[]> {
    assertSystemAdmin(user);
    return this.usersService.findAll(user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserType)
  updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: JwtPayload
  ): Promise<UserType> {
    assertSystemAdmin(user);
    return this.usersService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteUser(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    assertSystemAdmin(user);
    return this.usersService.remove(id);
  }

}
