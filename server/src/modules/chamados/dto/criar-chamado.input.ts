import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
