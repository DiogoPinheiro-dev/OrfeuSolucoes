import { Field, ObjectType } from '@nestjs/graphql';
import { EmpresaType } from '../../empresas/dto/empresa.type';
import { GrupoUsuarioType } from '../../grupos-usuarios/dto/grupo-usuario.type';

@ObjectType()
export class UserType {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  nome?: string | null;

  @Field(() => String, { nullable: true })
  login?: string | null;

  @Field()
  email!: string;

  @Field(() => EmpresaType, { nullable: true })
  empresa?: EmpresaType | null;

  @Field(() => [EmpresaType])
  empresas!: EmpresaType[];

  @Field(() => GrupoUsuarioType, { nullable: true })
  grupo?: GrupoUsuarioType | null;

  @Field()
  podeVisualizar!: boolean;

  @Field()
  podeIncluir!: boolean;

  @Field()
  podeAlterar!: boolean;

  @Field()
  podeExcluir!: boolean;

  @Field()
  deveAlterarSenha!: boolean;

  @Field(() => [String])
  availableSolutions!: string[];
}
