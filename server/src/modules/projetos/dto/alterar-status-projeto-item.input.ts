import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { ProjetoItemStatus } from '../types/projeto-item.types';

@InputType()
export class AlterarStatusProjetoItemInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;

  @Field(() => ProjetoItemStatus)
  @IsEnum(ProjetoItemStatus)
  status!: ProjetoItemStatus;
}

@InputType()
export class VersionarProjetoItemInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  versao!: number;
}
