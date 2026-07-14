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
}

@InputType()
export class CreateGoogleEmailContaInput {
  @Field(() => String) @IsString() @MinLength(2) nome!: string;
  @Field(() => String) @IsIn(['GMAIL', 'GOOGLE_WORKSPACE']) tipo!: string;
  @Field(() => String) @IsEmail() emailGoogle!: string;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
}

@InputType()
export class UpdateGoogleEmailContaInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MinLength(2) nome?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(['GMAIL', 'GOOGLE_WORKSPACE']) tipo?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsEmail() emailGoogle?: string;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
}

@ObjectType()
export class GoogleSendAsType {
  @Field(() => String) email!: string;
  @Field(() => String, { nullable: true }) nome?: string | null;
  @Field(() => Boolean) padrao!: boolean;
  @Field(() => Boolean) verificado!: boolean;
}

@ObjectType()
export class ChamadoSolucaoEmailType {
  @Field(() => Int) id!: number;
  @Field(() => Int) solucaoId!: number;
  @Field(() => String) solucaoNome!: string;
  @Field(() => Int) googleContaId!: number;
  @Field(() => String) googleContaNome!: string;
  @Field(() => String) remetenteEmail!: string;
  @Field(() => String, { nullable: true }) remetenteNome?: string | null;
  @Field(() => String, { nullable: true }) responderParaEmail?: string | null;
  @Field(() => Boolean) ativo!: boolean;
}

@InputType()
export class CreateChamadoSolucaoEmailInput {
  @Field(() => Int) @IsInt() solucaoId!: number;
  @Field(() => Int) @IsInt() googleContaId!: number;
  @Field(() => String) @IsEmail() remetenteEmail!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() remetenteNome?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsEmail() responderParaEmail?: string | null;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
}

@InputType()
export class UpdateChamadoSolucaoEmailInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() solucaoId?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() googleContaId?: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsEmail() remetenteEmail?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() remetenteNome?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsEmail() responderParaEmail?: string | null;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() ativo?: boolean;
}