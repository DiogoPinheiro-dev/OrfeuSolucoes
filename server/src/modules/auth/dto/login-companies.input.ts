import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class LoginCompaniesInput {
  @Field()
  @IsString()
  loginOrEmail!: string;

  @Field()
  @MinLength(6)
  senha!: string;
}
