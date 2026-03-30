import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class CreateServicoInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  titulo?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descricao?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  valor?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  desconto?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  vendas?: number;
}
