import { Type } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ProjetoMembroInput } from './create-projeto.input';

@InputType()
export class UpdateProjetoEquipeInput {
  @Field()
  @IsUUID()
  projetoId!: string;

  @Field()
  @IsUUID()
  responsavelId!: string;

  @Field(() => [ProjetoMembroInput], { nullable: true, defaultValue: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: ProjetoMembroInput) => item.usuarioId)
  @ValidateNested({ each: true })
  @Type(() => ProjetoMembroInput)
  participantes?: ProjetoMembroInput[];
}
