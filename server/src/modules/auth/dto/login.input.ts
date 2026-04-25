import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsInt, IsOptional, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(6)
  senha!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  empresaId?: number;
}
