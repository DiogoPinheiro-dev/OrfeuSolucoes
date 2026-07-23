import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AtualizarCicloProjetoInput } from './dto/atualizar-ciclo-projeto.input';
import {
  AlterarStatusProjetoItemInput,
  VersionarProjetoItemInput
} from './dto/alterar-status-projeto-item.input';
import { CreateProjetoInput } from './dto/create-projeto.input';
import { MoverProjetoItemBacklogInput } from './dto/mover-projeto-item-backlog.input';
import {
  ProjetoBacklogMovimentoType,
  ProjetoBacklogProjetoType
} from './dto/projeto-backlog.type';
import { CreateProjetoItemInput } from './dto/create-projeto-item.input';
import { ProjetoItemFiltroInput } from './dto/projeto-item-filtro.input';
import { ProjetoItemHistoricoType } from './dto/projeto-item-historico.type';
import { ProjetoItemPageType, ProjetoItemType } from './dto/projeto-item.type';
import { ProjetoFiltroInput } from './dto/projeto-filtro.input';
import { ProjetoPageType, ProjetoType, ProjetoUsuarioType } from './dto/projeto.type';
import { UpdateProjetoInput } from './dto/update-projeto.input';
import { UpdateProjetoItemInput } from './dto/update-projeto-item.input';
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

  @Mutation(() => ProjetoItemType)
  createProjetoItem(
    @Args('input') input: CreateProjetoItemInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.projetosService.createItem(input, user);
  }

  @Mutation(() => ProjetoItemType)
  updateProjetoItem(
    @Args('input') input: UpdateProjetoItemInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.projetosService.updateItem(input, user);
  }

  @Mutation(() => ProjetoItemType)
  alterarStatusProjetoItem(
    @Args('input') input: AlterarStatusProjetoItemInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.projetosService.alterarStatusItem(input, user);
  }

  @Mutation(() => ProjetoItemType)
  arquivarProjetoItem(
    @Args('input') input: VersionarProjetoItemInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.projetosService.arquivarItem(input, user);
  }

  @Mutation(() => ProjetoItemType)
  reativarProjetoItem(
    @Args('input') input: VersionarProjetoItemInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.projetosService.reativarItem(input, user);
  }

  @Query(() => ProjetoItemPageType)
  projetoItens(
    @Args('filtro') filtro: ProjetoItemFiltroInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemPageType> {
    return this.projetosService.itens(user, filtro);
  }

  @Query(() => ProjetoItemType)
  projetoItem(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.projetosService.item(id, user);
  }

  @Query(() => [ProjetoItemHistoricoType])
  projetoItemHistorico(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoItemHistoricoType[]> {
    return this.projetosService.itemHistorico(id, user);
  }

  @Query(() => [ProjetoBacklogProjetoType])
  projetoBacklogProjetos(
    @CurrentUser() user: JwtPayload,
    @Args('incluirArquivados', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false
    }) incluirArquivados?: boolean
  ): Promise<ProjetoBacklogProjetoType[]> {
    return this.projetosService.backlogProjetos(
      user,
      incluirArquivados
    );
  }

  @Query(() => [ProjetoUsuarioType])
  projetoBacklogResponsaveis(
    @Args('projetoId') projetoId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoUsuarioType[]> {
    return this.projetosService.backlogResponsaveis(projetoId, user);
  }

  @Mutation(() => ProjetoBacklogMovimentoType)
  moverProjetoItemBacklog(
    @Args('input') input: MoverProjetoItemBacklogInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjetoBacklogMovimentoType> {
    return this.projetosService.moverItemBacklog(input, user);
  }
}
