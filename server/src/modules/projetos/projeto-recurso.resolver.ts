import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ExcluirProjetoRecursoInput, SalvarProjetoRecursoInput } from './dto/projeto-recurso.input';
import { ProjetoRecursoPainelType, ProjetoRecursoProjetoType, ProjetoRecursoType } from './dto/projeto-recurso.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoRecursoResolver {
  constructor(private readonly service: ProjetosService) {}

  @Query(() => [ProjetoRecursoProjetoType])
  projetoRecursosProjetos(@CurrentUser() user: JwtPayload) { return this.service.recursosProjetos(user); }

  @Query(() => ProjetoRecursoPainelType)
  projetoRecursos(@CurrentUser() user: JwtPayload) { return this.service.recursos(user); }

  @Mutation(() => ProjetoRecursoType)
  salvarProjetoRecurso(@Args('input') input: SalvarProjetoRecursoInput, @CurrentUser() user: JwtPayload) { return this.service.salvarRecurso(input, user); }

  @Mutation(() => Boolean)
  excluirProjetoRecurso(@Args('input') input: ExcluirProjetoRecursoInput, @CurrentUser() user: JwtPayload) { return this.service.excluirRecurso(input, user); }

}
