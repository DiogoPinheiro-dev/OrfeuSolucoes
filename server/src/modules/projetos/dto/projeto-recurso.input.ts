import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class SalvarProjetoRecursoInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() id?: string | null;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) versao?: number | null;
  @Field() @IsUUID() usuarioId!: string;
  @Field(() => [String]) @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsUUID('4', { each: true }) projetoIds!: string[];
  @Field() @IsBoolean() ativo!: boolean;
}

@InputType()
export class ExcluirProjetoRecursoInput {
  @Field() @IsUUID() id!: string;
  @Field(() => Int) @IsInt() @Min(1) versao!: number;
}
