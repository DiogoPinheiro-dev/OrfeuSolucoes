import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { registerEnumType } from '@nestjs/graphql';

export enum ProjetoBacklogDirecao {
  TOPO = 'TOPO',
  SUBIR = 'SUBIR',
  DESCER = 'DESCER',
  FUNDO = 'FUNDO'
}

registerEnumType(ProjetoBacklogDirecao, {
  name: 'ProjetoBacklogDirecao'
});

@InputType()
export class MoverProjetoItemBacklogInput {
  @Field()
  @IsUUID()
  itemId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  backlogVersao!: number;

  @Field(() => ProjetoBacklogDirecao)
  @IsEnum(ProjetoBacklogDirecao)
  direcao!: ProjetoBacklogDirecao;
}
