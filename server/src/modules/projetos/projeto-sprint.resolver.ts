import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  AlterarEscopoProjetoSprintInput,
  ConcluirProjetoSprintInput,
  CreateProjetoSprintInput,
  TransicionarProjetoSprintInput,
  UpdateProjetoSprintInput
} from './dto/projeto-sprint.input';
import {
  ProjetoSprintPainelType,
  ProjetoSprintType
} from './dto/projeto-sprint.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver(() => ProjetoSprintType)
export class ProjetoSprintResolver {
  constructor(private readonly projetosService: ProjetosService) {}

  @Query(() => ProjetoSprintPainelType)
  projetoSprints(
    @Args('projetoId') projetoId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintPainelType> {
    return this.projetosService.sprints(projetoId, user);
  }

  @Mutation(() => ProjetoSprintType)
  createProjetoSprint(
    @Args('input') input: CreateProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.createSprint(input, user);
  }

  @Mutation(() => ProjetoSprintType)
  updateProjetoSprint(
    @Args('input') input: UpdateProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.updateSprint(input, user);
  }

  @Mutation(() => ProjetoSprintType)
  adicionarItemProjetoSprint(
    @Args('input') input: AlterarEscopoProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.adicionarItemSprint(input, user);
  }

  @Mutation(() => ProjetoSprintType)
  removerItemProjetoSprint(
    @Args('input') input: AlterarEscopoProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.removerItemSprint(input, user);
  }

  @Mutation(() => ProjetoSprintType)
  iniciarProjetoSprint(
    @Args('input') input: TransicionarProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.iniciarSprint(input, user);
  }

  @Mutation(() => ProjetoSprintType)
  concluirProjetoSprint(
    @Args('input') input: ConcluirProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.concluirSprint(input, user);
  }

  @Mutation(() => ProjetoSprintType)
  cancelarProjetoSprint(
    @Args('input') input: TransicionarProjetoSprintInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.projetosService.cancelarSprint(input, user);
  }
}
