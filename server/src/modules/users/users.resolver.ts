import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';
import { UsersService } from './users.service';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserType)
  createUser(@Args('input') input: CreateUserInput): Promise<UserType> {
    return this.usersService.create(input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserType])
  users(@CurrentUser() user: JwtPayload): Promise<UserType[]> {
    this.assertSystemAdmin(user);
    return this.usersService.findAll(user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserType)
  updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: JwtPayload
  ): Promise<UserType> {
    this.assertSystemAdmin(user);
    return this.usersService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteUser(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    this.assertSystemAdmin(user);
    return this.usersService.remove(id);
  }

  private assertSystemAdmin(user: JwtPayload): void {
    if (user.login?.toLowerCase() !== 'admin') {
      throw new ForbiddenException('Apenas o usuario administrador inicial pode acessar o configurador.');
    }
  }
}
