import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoPainelType } from './dto/projeto-painel.type';
import { ProjetoPainelService } from './projeto-painel.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoPainelResolver {
  constructor(private readonly service: ProjetoPainelService) {}

  @Query(() => ProjetoPainelType)
  projetoPainel(
    @Args('projetoId') projetoId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.painel(projetoId, user);
  }
}
