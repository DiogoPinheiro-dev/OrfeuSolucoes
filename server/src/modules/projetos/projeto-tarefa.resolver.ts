import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ExcluirProjetoTarefaInput, SalvarProjetoTarefaInput } from './dto/projeto-tarefa.input';
import { ProjetoTarefaType } from './dto/projeto-tarefa.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoTarefaResolver {
  constructor(private readonly service: ProjetosService) {}

  @Mutation(() => ProjetoTarefaType)
  salvarProjetoTarefa(@Args('input') input: SalvarProjetoTarefaInput, @CurrentUser() user: JwtPayload) { return this.service.salvarTarefa(input, user); }

  @Mutation(() => Boolean)
  excluirProjetoTarefa(@Args('input') input: ExcluirProjetoTarefaInput, @CurrentUser() user: JwtPayload) { return this.service.excluirTarefa(input, user); }
}
