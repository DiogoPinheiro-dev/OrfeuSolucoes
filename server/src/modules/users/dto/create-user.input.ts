import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, MinLength } from 'class-validator';

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
}
