import { Field, ObjectType } from '@nestjs/graphql';
import { EmpresaType } from '../../empresas/dto/empresa.type';
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

  @Field(() => EmpresaType, { nullable: true })
  empresa?: EmpresaType | null;

  @Field(() => [EmpresaType])
  empresas!: EmpresaType[];

  @Field(() => [String])
  availableSolutions!: string[];
}
