import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString } from 'class-validator';
@InputType()
export class AlterarCategoriaChamadoInput {
  @Field() @IsString() chamadoId!: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() categoriaId?: number | null;
}