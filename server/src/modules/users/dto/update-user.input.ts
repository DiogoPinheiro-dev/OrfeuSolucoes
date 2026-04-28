import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmail, IsInt, IsOptional, IsUUID, MinLength } from 'class-validator';
import { UserRole } from './user-role.enum';

@InputType()
export class UpdateUserInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  nome?: string;

  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @MinLength(6)
  @IsOptional()
  senha?: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  tipo?: UserRole;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  empresaIds?: number[];
}
