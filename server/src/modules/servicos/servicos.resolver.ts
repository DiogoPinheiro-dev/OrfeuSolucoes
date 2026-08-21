import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateServicoInput } from './dto/create-servico.input';
import { ServicoType } from './dto/servico.type';
import { UpdateServicoInput } from './dto/update-servico.input';
import { ServicosService } from './servicos.service';

@UseGuards(GqlAuthGuard)
@Resolver(() => ServicoType)
export class ServicosResolver {
  constructor(private readonly servicosService: ServicosService) {}

  @Mutation(() => ServicoType)
  createServico(
    @Args('input') input: CreateServicoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ServicoType> {
    return this.servicosService.createAsAdmin(input, user);
  }

  @Query(() => [ServicoType])
  servicos(@CurrentUser() user: JwtPayload): Promise<ServicoType[]> {
    return this.servicosService.findAllAsAdmin(user);
  }

  @Mutation(() => ServicoType)
  updateServico(
    @Args('input') input: UpdateServicoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ServicoType> {
    return this.servicosService.updateAsAdmin(input, user);
  }

  @Mutation(() => Boolean)
  deleteServico(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    return this.servicosService.removeAsAdmin(id, user);
  }
}
