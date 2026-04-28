import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmail, IsInt, IsOptional, MinLength } from 'class-validator';
import { UserRole } from './user-role.enum';

@InputType()
export class CreateUserInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  nome?: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(6)
  senha!: string;

  @Field(() => UserRole, { nullable: true, defaultValue: UserRole.USUARIO })
  @IsOptional()
  tipo?: UserRole;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  empresaIds?: number[];
}
