import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class ResponderChamadoInput {
  @Field()
  @IsString()
  chamadoId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  conteudo!: string;
}
