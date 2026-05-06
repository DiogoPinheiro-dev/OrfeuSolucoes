import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  loginOrEmail!: string;

  @Field()
  @MinLength(6)
  senha!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  empresaId?: number;
}
