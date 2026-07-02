import { Field, InputType } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class AtualizarChamadoAcompanhantesInput {
  @Field()
  @IsString()
  chamadoId!: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  usuarioIds?: string[] | null;
}