import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AtualizarCicloProjetoInput } from './dto/atualizar-ciclo-projeto.input';
import { CreateProjetoInput } from './dto/create-projeto.input';
import { ProjetoFiltroInput } from './dto/projeto-filtro.input';
import { ProjetoPageType, ProjetoType, ProjetoUsuarioType } from './dto/projeto.type';
import { UpdateProjetoInput } from './dto/update-projeto.input';
import { UpdateProjetoEquipeInput } from './dto/update-projeto-equipe.input';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver(() => ProjetoType)
export class ProjetosResolver {
  constructor(private readonly projetosService: ProjetosService) {}

  @Mutation(() => ProjetoType)
  createProjeto(
    @Args('input') input: CreateProjetoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.create(input, user);
  }

  @Mutation(() => ProjetoType)
  updateProjeto(
    @Args('input') input: UpdateProjetoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.update(input, user);
  }
  @Mutation(() => ProjetoType)
  updateProjetoEquipe(
    @Args('input') input: UpdateProjetoEquipeInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.updateEquipe(input, user);
  }

  @Mutation(() => ProjetoType)
  atualizarSituacaoProjeto(
    @Args('input') input: AtualizarCicloProjetoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.atualizarCiclo(input, user);
  }

  @Mutation(() => ProjetoType)
  arquivarProjeto(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.arquivar(id, user);
  }

  @Mutation(() => ProjetoType)
  reativarProjeto(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.reativar(id, user);
  }
  @Query(() => String)
  sugerirChaveProjeto(
    @Args('nome') nome: string,
    @CurrentUser() user: JwtPayload
  ): Promise<string> {
    return this.projetosService.sugerirChave(nome, user);
  }

  @Query(() => ProjetoPageType)
  projetos(
    @CurrentUser() user: JwtPayload,
    @Args('filtro', { type: () => ProjetoFiltroInput, nullable: true }) filtro?: ProjetoFiltroInput
  ): Promise<ProjetoPageType> {
    return this.projetosService.projetos(user, filtro);
  }

  @Query(() => ProjetoType)
  projeto(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoType> {
    return this.projetosService.projeto(id, user);
  }

  @Query(() => [ProjetoUsuarioType])
  projetoParticipantesDisponiveis(@CurrentUser() user: JwtPayload): Promise<ProjetoUsuarioType[]> {
    return this.projetosService.participantesDisponiveis(user);
  }
}
