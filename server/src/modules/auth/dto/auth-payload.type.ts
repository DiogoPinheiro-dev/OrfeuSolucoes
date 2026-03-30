import { Field, ObjectType } from '@nestjs/graphql';
import { UserType } from '../../users/dto/user.type';

@ObjectType()
export class AuthPayloadType {
  @Field()
  accessToken!: string;

  @Field(() => UserType)
  user!: UserType;
}
