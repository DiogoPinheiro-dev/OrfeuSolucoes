import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CreateUserInput } from './dto/create-user.input';
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
}
