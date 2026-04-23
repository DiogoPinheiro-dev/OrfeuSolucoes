import { Field, ObjectType } from '@nestjs/graphql';
import { UserRole } from './user-role.enum';

@ObjectType()
export class UserType {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field()
  email!: string;

  @Field(() => UserRole)
  tipo!: UserRole;
}
