import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString } from 'class-validator';

@InputType()
export class AlterarPrioridadeChamadoInput {
  @Field()
  @IsString()
  chamadoId!: string;

  @Field(() => Int)
  @IsInt()
  prioridadeId!: number;
}
