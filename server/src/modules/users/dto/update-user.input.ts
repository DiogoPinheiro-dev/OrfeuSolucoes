import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

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
  login?: string;

  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @MinLength(6)
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
