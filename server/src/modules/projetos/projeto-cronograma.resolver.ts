import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  CreateProjetoItemDependenciaInput,
  ProjetoCronogramaFiltroInput,
  UpdateProjetoCronogramaItemDatasInput,
  VersionarProjetoItemDependenciaInput
} from './dto/projeto-cronograma.input';
import {
  ProjetoCronogramaElementoType,
  ProjetoCronogramaPainelType,
  ProjetoItemDependenciaType
} from './dto/projeto-cronograma.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoCronogramaResolver {
  constructor(private readonly projetosService: ProjetosService) {}

  @Query(() => ProjetoCronogramaPainelType)
  projetoCronograma(
    @Args('filtro') filtro: ProjetoCronogramaFiltroInput,
    @CurrentUser() user: JwtPayload
  ) {
    return this.projetosService.cronograma(filtro, user);
  }

  @Mutation(() => ProjetoItemDependenciaType)
  createProjetoItemDependencia(
    @Args('input') input: CreateProjetoItemDependenciaInput,
    @CurrentUser() user: JwtPayload
  ) {
    return this.projetosService.createDependencia(input, user);
  }

  @Mutation(() => ProjetoItemDependenciaType)
  arquivarProjetoItemDependencia(
    @Args('input') input: VersionarProjetoItemDependenciaInput,
    @CurrentUser() user: JwtPayload
  ) {
    return this.projetosService.archiveDependencia(input, user, false);
  }

  @Mutation(() => ProjetoItemDependenciaType)
  reativarProjetoItemDependencia(
    @Args('input') input: VersionarProjetoItemDependenciaInput,
    @CurrentUser() user: JwtPayload
  ) {
    return this.projetosService.archiveDependencia(input, user, true);
  }

  @Mutation(() => ProjetoCronogramaElementoType)
  updateProjetoCronogramaItemDatas(
    @Args('input') input: UpdateProjetoCronogramaItemDatasInput,
    @CurrentUser() user: JwtPayload
  ) {
    return this.projetosService.updateCronogramaItemDatas(input, user);
  }
}
