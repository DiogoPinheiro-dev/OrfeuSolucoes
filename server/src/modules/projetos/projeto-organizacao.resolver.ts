import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ExcluirCapacitacaoInput, ExcluirEquipeInput, SalvarCapacitacaoInput, SalvarEquipeInput } from './dto/projeto-organizacao.input';
import { CapacitacaoType, EquipeType, ProjetoOrganizacaoPainelType } from './dto/projeto-organizacao.type';
import { ProjetoOrganizacaoService } from './projeto-organizacao.service';

@Resolver()
@UseGuards(GqlAuthGuard)
export class ProjetoOrganizacaoResolver {
  constructor(private readonly service: ProjetoOrganizacaoService) {}

  @Query(() => ProjetoOrganizacaoPainelType)
  projetoOrganizacao(@CurrentUser() user: JwtPayload) { return this.service.painel(user); }

  @Mutation(() => CapacitacaoType)
  salvarCapacitacao(@Args('input') input: SalvarCapacitacaoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarCapacitacao(input, user); }

  @Mutation(() => Boolean)
  excluirCapacitacao(@Args('input') input: ExcluirCapacitacaoInput, @CurrentUser() user: JwtPayload) { return this.service.excluirCapacitacao(input, user); }

  @Mutation(() => EquipeType)
  salvarEquipe(@Args('input') input: SalvarEquipeInput, @CurrentUser() user: JwtPayload) { return this.service.salvarEquipe(input, user); }

  @Mutation(() => Boolean)
  excluirEquipe(@Args('input') input: ExcluirEquipeInput, @CurrentUser() user: JwtPayload) { return this.service.excluirEquipe(input, user); }
}
