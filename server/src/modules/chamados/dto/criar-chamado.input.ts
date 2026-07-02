import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CriarChamadoInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  titulo!: string;

  @Field()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  descricao!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  tipo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  prioridade?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoriaId?: number | null;

  @Field(() => Int)
  @IsInt()
  solucaoId!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  funcionalidadeId?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  responsavelGrupoId?: number | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  acompanhanteIds?: string[] | null;
}
