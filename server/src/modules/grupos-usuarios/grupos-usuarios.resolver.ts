import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateGrupoUsuarioInput } from './dto/create-grupo-usuario.input';
import { GrupoUsuarioType } from './dto/grupo-usuario.type';
import { UpdateGrupoUsuarioInput } from './dto/update-grupo-usuario.input';
import { GruposUsuariosService } from './grupos-usuarios.service';

@Resolver(() => GrupoUsuarioType)
export class GruposUsuariosResolver {
  constructor(private readonly gruposUsuariosService: GruposUsuariosService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [GrupoUsuarioType])
  gruposUsuarios(@CurrentUser() user: JwtPayload): Promise<GrupoUsuarioType[]> {
    this.assertSystemAdmin(user);
    return this.gruposUsuariosService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => GrupoUsuarioType)
  createGrupoUsuario(
    @Args('input') input: CreateGrupoUsuarioInput,
    @CurrentUser() user: JwtPayload
  ): Promise<GrupoUsuarioType> {
    this.assertSystemAdmin(user);
    return this.gruposUsuariosService.create(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => GrupoUsuarioType)
  updateGrupoUsuario(
    @Args('input') input: UpdateGrupoUsuarioInput,
    @CurrentUser() user: JwtPayload
  ): Promise<GrupoUsuarioType> {
    this.assertSystemAdmin(user);
    return this.gruposUsuariosService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteGrupoUsuario(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    this.assertSystemAdmin(user);
    return this.gruposUsuariosService.remove(id);
  }

  private assertSystemAdmin(user: JwtPayload): void {
    if (user.login?.toLowerCase() !== 'admin') {
      throw new ForbiddenException('Apenas o usuario administrador inicial pode acessar o configurador.');
    }
  }
}
