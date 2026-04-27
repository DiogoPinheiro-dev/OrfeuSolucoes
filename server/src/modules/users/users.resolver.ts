import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
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
  users(): Promise<UserType[]> {
    return this.usersService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserType)
  updateUser(@Args('input') input: UpdateUserInput): Promise<UserType> {
    return this.usersService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteUser(@Args('id') id: string): Promise<boolean> {
    return this.usersService.remove(id);
  }
}
