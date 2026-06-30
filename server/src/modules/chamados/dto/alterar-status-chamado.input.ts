import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class AlterarStatusChamadoInput {
  @Field()
  @IsString()
  chamadoId!: string;

  @Field()
  @IsString()
  status!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string | null;
}
