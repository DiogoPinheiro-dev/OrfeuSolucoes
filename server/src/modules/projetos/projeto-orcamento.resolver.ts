import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AprovarProjetoOrcamentoInput, ExcluirProjetoOrcamentoItemInput, SalvarProjetoCustoInput, SalvarProjetoOrcamentoCategoriaInput, SalvarProjetoOrcamentoInput } from './dto/projeto-orcamento.input';
import { ProjetoCustoType, ProjetoFinanceiroType, ProjetoOrcamentoCategoriaType, ProjetoOrcamentoPainelType, ProjetoOrcamentoProjetoType } from './dto/projeto-orcamento.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoOrcamentoResolver {
  constructor(private readonly service: ProjetosService) {}

  @Query(() => [ProjetoOrcamentoProjetoType])
  projetoOrcamentoProjetos(@CurrentUser() user: JwtPayload) { return this.service.orcamentoProjetos(user); }

  @Query(() => ProjetoOrcamentoPainelType)
  projetoOrcamento(@Args('projetoId') projetoId: string, @CurrentUser() user: JwtPayload) { return this.service.orcamento(projetoId, user); }

  @Mutation(() => ProjetoFinanceiroType)
  salvarProjetoOrcamento(@Args('input') input: SalvarProjetoOrcamentoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarOrcamento(input, user); }

  @Mutation(() => ProjetoOrcamentoCategoriaType)
  salvarProjetoOrcamentoCategoria(@Args('input') input: SalvarProjetoOrcamentoCategoriaInput, @CurrentUser() user: JwtPayload) { return this.service.salvarOrcamentoCategoria(input, user); }

  @Mutation(() => ProjetoCustoType)
  salvarProjetoCusto(@Args('input') input: SalvarProjetoCustoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarCusto(input, user); }

  @Mutation(() => Boolean)
  excluirProjetoOrcamentoCategoria(@Args('input') input: ExcluirProjetoOrcamentoItemInput, @CurrentUser() user: JwtPayload) { return this.service.excluirOrcamentoCategoria(input, user); }

  @Mutation(() => Boolean)
  excluirProjetoCusto(@Args('input') input: ExcluirProjetoOrcamentoItemInput, @CurrentUser() user: JwtPayload) { return this.service.excluirCusto(input, user); }

  @Mutation(() => ProjetoFinanceiroType)
  aprovarProjetoOrcamento(@Args('input') input: AprovarProjetoOrcamentoInput, @CurrentUser() user: JwtPayload) { return this.service.aprovarOrcamento(input, user); }

  @Mutation(() => ProjetoFinanceiroType)
  reabrirProjetoOrcamento(@Args('input') input: AprovarProjetoOrcamentoInput, @CurrentUser() user: JwtPayload) { return this.service.reabrirOrcamento(input, user); }
}
