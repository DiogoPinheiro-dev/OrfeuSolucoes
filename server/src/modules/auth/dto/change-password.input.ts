import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../common/security/password.policy';

@InputType()
export class ChangePasswordInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  senhaAtual?: string;

  @Field()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  novaSenha!: string;
}
