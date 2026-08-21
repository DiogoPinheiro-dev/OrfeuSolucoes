import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../common/security/password.policy';
import { LOGIN_MAX_LENGTH } from '../utils/user-normalization.util';

@InputType()
export class UpdateUserInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  nome?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[^@]+$/, { message: 'Login nao pode conter @.' })
  @MaxLength(LOGIN_MAX_LENGTH)
  login?: string;

  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @IsOptional()
  senha?: string;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  empresaIds?: number[];

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  grupoId?: number;

}
