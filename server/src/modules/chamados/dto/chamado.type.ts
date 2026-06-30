import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChamadoMensagemType {
  @Field()
  id!: string;

  @Field()
  chamadoId!: string;

  @Field()
  autorId!: string;

  @Field(() => String, { nullable: true })
  autorNome?: string | null;

  @Field()
  tipo!: string;

  @Field()
  conteudo!: string;

  @Field(() => Date)
  criadoEm!: Date;
}

@ObjectType()
export class ChamadoHistoricoType {
  @Field()
  id!: string;

  @Field()
  chamadoId!: string;

  @Field(() => String, { nullable: true })
  usuarioId?: string | null;

  @Field(() => String, { nullable: true })
  usuarioNome?: string | null;

  @Field()
  evento!: string;

  @Field(() => String, { nullable: true })
  campo?: string | null;

  @Field(() => String, { nullable: true })
  valorAnterior?: string | null;

  @Field(() => String, { nullable: true })
  valorNovo?: string | null;

  @Field(() => String, { nullable: true })
  observacao?: string | null;

  @Field(() => Date)
  criadoEm!: Date;
}

@ObjectType()
export class ChamadoType {
  @Field()
  id!: string;

  @Field(() => Int)
  numero!: number;

  @Field(() => Int)
  empresaId!: number;

  @Field()
  solicitanteId!: string;

  @Field(() => String, { nullable: true })
  solicitanteNome?: string | null;

  @Field(() => String, { nullable: true })
  responsavelId?: string | null;

  @Field(() => String, { nullable: true })
  responsavelNome?: string | null;

  @Field(() => Int, { nullable: true })
  categoriaId?: number | null;

  @Field(() => String, { nullable: true })
  categoriaNome?: string | null;

  @Field()
  titulo!: string;

  @Field()
  descricao!: string;

  @Field()
  tipo!: string;

  @Field()
  prioridade!: string;

  @Field()
  status!: string;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;

  @Field(() => Date, { nullable: true })
  primeiraRespostaEm?: Date | null;

  @Field(() => Date, { nullable: true })
  resolvidoEm?: Date | null;

  @Field(() => Date, { nullable: true })
  encerradoEm?: Date | null;

  @Field(() => Int)
  versao!: number;

  @Field(() => [ChamadoMensagemType])
  mensagens!: ChamadoMensagemType[];

  @Field(() => [ChamadoHistoricoType])
  historico!: ChamadoHistoricoType[];
}

@ObjectType()
export class ChamadoPageType {
  @Field(() => [ChamadoType])
  items!: ChamadoType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;
}
