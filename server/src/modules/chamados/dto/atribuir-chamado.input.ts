import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class AtribuirChamadoInput {
  @Field()
  @IsString()
  chamadoId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  responsavelGrupoId?: number | null;
}