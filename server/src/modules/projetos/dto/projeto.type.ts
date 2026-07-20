import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjetoMetodologia, ProjetoPapel, ProjetoSaude, ProjetoSituacao } from '../types/projeto.types';

@ObjectType()
export class ProjetoUsuarioType {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field(() => String, { nullable: true })
  login?: string | null;

  @Field()
  email!: string;

  @Field(() => Int, { nullable: true })
  grupoId?: number | null;

  @Field(() => String, { nullable: true })
  grupoNome?: string | null;
}

@ObjectType()
export class ProjetoMembroType {
  @Field(() => Int)
  id!: number;

  @Field()
  usuarioId!: string;

  @Field(() => ProjetoPapel)
  papel!: ProjetoPapel;

  @Field(() => Date)
  incluidoEm!: Date;

  @Field(() => ProjetoUsuarioType)
  usuario!: ProjetoUsuarioType;
}

@ObjectType()
export class ProjetoPermissoesType {
  @Field()
  podeVisualizar!: boolean;

  @Field()
  podeAlterar!: boolean;

  @Field()
  podeGerenciarMembros!: boolean;

  @Field()
  podeAlterarStatus!: boolean;

  @Field()
  podeArquivar!: boolean;

  @Field()
  podeReativar!: boolean;
}

@ObjectType()
export class ProjetoType {
  @Field()
  id!: string;

  @Field(() => Int)
  empresaId!: number;

  @Field()
  chave!: string;

  @Field()
  nome!: string;

  @Field(() => String, { nullable: true })
  objetivo?: string | null;

  @Field(() => String, { nullable: true })
  descricao?: string | null;

  @Field(() => ProjetoMetodologia)
  metodologia!: ProjetoMetodologia;

  @Field(() => ProjetoSituacao)
  situacao!: ProjetoSituacao;

  @Field(() => ProjetoSaude)
  saude!: ProjetoSaude;

  @Field(() => Date, { nullable: true })
  inicioPrevistoEm?: Date | null;

  @Field(() => Date, { nullable: true })
  fimPrevistoEm?: Date | null;

  @Field(() => Date, { nullable: true })
  inicioRealEm?: Date | null;

  @Field(() => Date, { nullable: true })
  fimRealEm?: Date | null;

  @Field()
  responsavelId!: string;

  @Field(() => ProjetoUsuarioType)
  responsavel!: ProjetoUsuarioType;

  @Field(() => ProjetoUsuarioType)
  criadoPor!: ProjetoUsuarioType;

  @Field(() => Date, { nullable: true })
  arquivadoEm?: Date | null;

  @Field(() => ProjetoUsuarioType, { nullable: true })
  arquivadoPor?: ProjetoUsuarioType | null;

  @Field(() => Date)
  criadoEm!: Date;

  @Field(() => Date)
  atualizadoEm!: Date;

  @Field(() => [ProjetoMembroType])
  membros!: ProjetoMembroType[];

  @Field(() => ProjetoPapel, { nullable: true })
  meuPapel?: ProjetoPapel | null;

  @Field(() => ProjetoPermissoesType)
  permissoes!: ProjetoPermissoesType;
}

@ObjectType()
export class ProjetoPageType {
  @Field(() => [ProjetoType])
  items!: ProjetoType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pagina!: number;

  @Field(() => Int)
  limite!: number;

  @Field(() => Int)
  totalPaginas!: number;
}
