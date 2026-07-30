import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ExcluirGradeItemInput, SalvarGradeAlocacaoInput, SalvarGradeCapacidadeInput, SalvarGradeVinculoInput } from './dto/projeto-grade-capacitacao.input';
import { GradeAlocacaoType, GradeCapacidadeType, GradeCapacitacaoLinhaType, GradeCapacitacaoPainelType } from './dto/projeto-grade-capacitacao.type';
import { PlanejamentoRecursoPainelType } from './dto/projeto-planejamento-recurso.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoGradeCapacitacaoResolver {
  constructor(private readonly service: ProjetosService) {}

  @Query(() => GradeCapacitacaoPainelType)
  gradeCapacitacao(@CurrentUser() user: JwtPayload) { return this.service.gradeCapacitacao(user); }

  @Query(() => PlanejamentoRecursoPainelType)
  planejamentoRecursos(@CurrentUser() user: JwtPayload) { return this.service.planejamentoRecursos(user); }

  @Mutation(() => GradeCapacitacaoLinhaType)
  salvarGradeVinculo(@Args('input') input: SalvarGradeVinculoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarGradeVinculo(input, user); }

  @Mutation(() => GradeCapacidadeType)
  salvarGradeCapacidade(@Args('input') input: SalvarGradeCapacidadeInput, @CurrentUser() user: JwtPayload) { return this.service.salvarGradeCapacidade(input, user); }

  @Mutation(() => GradeAlocacaoType)
  salvarGradeAlocacao(@Args('input') input: SalvarGradeAlocacaoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarGradeAlocacao(input, user); }

  @Mutation(() => Boolean)
  excluirGradeCapacidade(@Args('input') input: ExcluirGradeItemInput, @CurrentUser() user: JwtPayload) { return this.service.excluirGradeCapacidade(input, user); }

  @Mutation(() => Boolean)
  excluirGradeAlocacao(@Args('input') input: ExcluirGradeItemInput, @CurrentUser() user: JwtPayload) { return this.service.excluirGradeAlocacao(input, user); }
}
