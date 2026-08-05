import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  ExcluirPlanejamentoRecursoExecucaoInput,
  SalvarPlanejamentoRecursoExecucaoInput
} from './dto/projeto-planejamento-recurso.input';
import { PlanejamentoRecursoExecucaoType, PlanejamentoRecursoPainelType } from './dto/projeto-planejamento-recurso.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoPlanejamentoRecursoResolver {
  constructor(private readonly service: ProjetosService) {}

  @Query(() => PlanejamentoRecursoPainelType)
  planejamentoRecursos(@CurrentUser() user: JwtPayload) { return this.service.planejamentoRecursos(user); }

  @Mutation(() => PlanejamentoRecursoExecucaoType)
  salvarPlanejamentoRecursoExecucao(@Args('input') input: SalvarPlanejamentoRecursoExecucaoInput, @CurrentUser() user: JwtPayload) {
    return this.service.salvarPlanejamentoRecursoExecucao(input, user);
  }

  @Mutation(() => Boolean)
  excluirPlanejamentoRecursoExecucao(@Args('input') input: ExcluirPlanejamentoRecursoExecucaoInput, @CurrentUser() user: JwtPayload) {
    return this.service.excluirPlanejamentoRecursoExecucao(input, user);
  }
}
