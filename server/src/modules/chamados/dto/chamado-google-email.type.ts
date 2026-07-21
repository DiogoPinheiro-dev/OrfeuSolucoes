import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

@ObjectType()
export class GoogleEmailContaType {
  @Field(() => Int) id!: number;
  @Field(() => String) nome!: string;
  @Field(() => String) tipo!: string;
  @Field(() => String) emailGoogle!: string;
  @Field(() => Boolean) conectado!: boolean;
  @Field(() => Date, { nullable: true }) conectadoEm?: Date | null;
  @Field(() => Boolean) ativo!: boolean;
  @Field(() => Boolean) principal!: boolean;
}

@InputType()
export class CreateGoogleEmailContaInput {
  @Field(() => String) @IsString() @MinLength(2) nome!: string;
  @Field(() => String) @IsIn(['GMAIL', 'GOOGLE_WORKSPACE']) tipo!: string;
  @Field(() => String) @IsEmail() emailGoogle!: string;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() principal?: boolean;
}

@InputType()
export class UpdateGoogleEmailContaInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MinLength(2) nome?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(['GMAIL', 'GOOGLE_WORKSPACE']) tipo?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsEmail() emailGoogle?: string;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() principal?: boolean;
}
