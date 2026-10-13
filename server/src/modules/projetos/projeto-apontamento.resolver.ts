import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  EnviarProjetoApontamentosInput,
  MeusProjetoApontamentosFiltroInput,
  SalvarProjetoApontamentoInput,
  VersionarProjetoApontamentoInput
} from './dto/projeto-apontamento.input';
import {
  MeusProjetoApontamentosPageType,
  ProjetoApontamentoItemType,
  ProjetoApontamentoProjetoType,
  ProjetoApontamentoType
} from './dto/projeto-apontamento.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoApontamentoResolver {
  constructor(private readonly service: ProjetosService) {}

  @Query(() => [ProjetoApontamentoProjetoType])
  projetoApontamentoProjetos(@CurrentUser() user: JwtPayload) { return this.service.apontamentoProjetos(user); }

  @Query(() => [ProjetoApontamentoItemType])
  projetoApontamentoItens(@Args('projetoId') projetoId: string, @CurrentUser() user: JwtPayload) { return this.service.apontamentoItens(projetoId, user); }

  @Query(() => MeusProjetoApontamentosPageType)
  meusProjetoApontamentos(@Args('filtro') filtro: MeusProjetoApontamentosFiltroInput, @CurrentUser() user: JwtPayload) { return this.service.meusApontamentos(user, filtro); }

  @Mutation(() => ProjetoApontamentoType)
  salvarProjetoApontamento(@Args('input') input: SalvarProjetoApontamentoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarApontamento(input, user); }

  @Mutation(() => Boolean)
  excluirProjetoApontamento(@Args('input') input: VersionarProjetoApontamentoInput, @CurrentUser() user: JwtPayload) { return this.service.excluirApontamento(input, user); }

  @Mutation(() => Boolean)
  descartarProjetoApontamento(@Args('input') input: VersionarProjetoApontamentoInput, @CurrentUser() user: JwtPayload) { return this.service.descartarApontamento(input, user); }

  @Mutation(() => [ProjetoApontamentoType])
  enviarProjetoApontamentos(@Args('input') input: EnviarProjetoApontamentosInput, @CurrentUser() user: JwtPayload) { return this.service.enviarApontamentos(input, user); }

  @Mutation(() => ProjetoApontamentoType)
  recolherProjetoApontamento(@Args('input') input: VersionarProjetoApontamentoInput, @CurrentUser() user: JwtPayload) { return this.service.recolherApontamento(input, user); }
}
