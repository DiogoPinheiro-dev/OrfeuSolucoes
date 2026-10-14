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
import {
  AprovarProjetoApontamentosInput,
  FecharProjetoApontamentoPeriodoInput,
  ProjetoHorasFiltroInput,
  ReabrirProjetoApontamentoInput,
  ReabrirProjetoApontamentoPeriodoInput,
  RecalcularCustoProjetoApontamentosInput,
  RejeitarProjetoApontamentosInput
} from './dto/projeto-horas.input';
import {
  ProjetoApontamentoCompetenciaType,
  ProjetoApontamentoRecalculoType,
  ProjetoHorasApontamentoType,
  ProjetoHorasPageType
} from './dto/projeto-horas.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoApontamentoResolver {
  constructor(private readonly service: ProjetosService) {}

  @Query(() => String)
  projetoHojeOperacional() { return this.service.hojeOperacional(); }

  @Query(() => [ProjetoApontamentoProjetoType])
  projetoApontamentoProjetos(@CurrentUser() user: JwtPayload) { return this.service.apontamentoProjetos(user); }

  @Query(() => [ProjetoApontamentoItemType])
  projetoApontamentoItens(@Args('projetoId') projetoId: string, @CurrentUser() user: JwtPayload) { return this.service.apontamentoItens(projetoId, user); }

  @Query(() => MeusProjetoApontamentosPageType)
  meusProjetoApontamentos(@Args('filtro') filtro: MeusProjetoApontamentosFiltroInput, @CurrentUser() user: JwtPayload) { return this.service.meusApontamentos(user, filtro); }

  @Query(() => [ProjetoApontamentoProjetoType])
  projetoHorasProjetos(
    @Args('incluirArquivados', { type: () => Boolean, nullable: true, defaultValue: false }) incluirArquivados: boolean,
    @CurrentUser() user: JwtPayload
  ) { return this.service.horasProjetos(user, incluirArquivados); }

  @Query(() => ProjetoHorasPageType)
  projetoHoras(@Args('filtro') filtro: ProjetoHorasFiltroInput, @CurrentUser() user: JwtPayload) { return this.service.horas(filtro, user); }

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

  @Mutation(() => [ProjetoHorasApontamentoType])
  aprovarProjetoApontamentos(@Args('input') input: AprovarProjetoApontamentosInput, @CurrentUser() user: JwtPayload) { return this.service.aprovarApontamentos(input, user); }

  @Mutation(() => [ProjetoHorasApontamentoType])
  rejeitarProjetoApontamentos(@Args('input') input: RejeitarProjetoApontamentosInput, @CurrentUser() user: JwtPayload) { return this.service.rejeitarApontamentos(input, user); }

  @Mutation(() => ProjetoHorasApontamentoType)
  reabrirProjetoApontamento(@Args('input') input: ReabrirProjetoApontamentoInput, @CurrentUser() user: JwtPayload) { return this.service.reabrirApontamento(input, user); }

  @Mutation(() => ProjetoApontamentoCompetenciaType)
  fecharProjetoApontamentoPeriodo(@Args('input') input: FecharProjetoApontamentoPeriodoInput, @CurrentUser() user: JwtPayload) { return this.service.fecharPeriodoDeApontamentos(input, user); }

  @Mutation(() => ProjetoApontamentoCompetenciaType)
  reabrirProjetoApontamentoPeriodo(@Args('input') input: ReabrirProjetoApontamentoPeriodoInput, @CurrentUser() user: JwtPayload) { return this.service.reabrirPeriodoDeApontamentos(input, user); }

  @Mutation(() => ProjetoApontamentoRecalculoType)
  recalcularCustoProjetoApontamentos(@Args('input') input: RecalcularCustoProjetoApontamentosInput, @CurrentUser() user: JwtPayload) { return this.service.recalcularCustoDosApontamentos(input, user); }
}
