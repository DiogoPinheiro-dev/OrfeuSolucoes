import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CreateServicoInput } from './dto/create-servico.input';
import { ServicoType } from './dto/servico.type';
import { UpdateServicoInput } from './dto/update-servico.input';
import { ServicosService } from './servicos.service';

@UseGuards(GqlAuthGuard)
@Resolver(() => ServicoType)
export class ServicosResolver {
  constructor(private readonly servicosService: ServicosService) {}

  @Mutation(() => ServicoType)
  createServico(@Args('input') input: CreateServicoInput): Promise<ServicoType> {
    return this.servicosService.create(input);
  }

  @Query(() => [ServicoType])
  servicos(): Promise<ServicoType[]> {
    return this.servicosService.findAll();
  }

  @Mutation(() => ServicoType)
  updateServico(@Args('input') input: UpdateServicoInput): Promise<ServicoType> {
    return this.servicosService.update(input);
  }

  @Mutation(() => Boolean)
  deleteServico(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    return this.servicosService.remove(id);
  }
}
