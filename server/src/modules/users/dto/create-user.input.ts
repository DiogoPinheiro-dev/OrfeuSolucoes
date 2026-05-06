import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  nome?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  login?: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(6)
  senha!: string;

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
