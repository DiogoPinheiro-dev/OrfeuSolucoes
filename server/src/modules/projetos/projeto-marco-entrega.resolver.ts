import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import {
  CreateProjetoEntregaInput,
  CreateProjetoMarcoInput,
  UpdateProjetoEntregaInput,
  UpdateProjetoMarcoInput,
  VersionarProjetoCompromissoInput
} from './dto/projeto-marco-entrega.input';
import {
  ProjetoEntregaType,
  ProjetoMarcoEntregaPainelType,
  ProjetoMarcoType
} from './dto/projeto-marco-entrega.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoMarcoEntregaResolver {
  constructor(private readonly projetosService: ProjetosService) {}

  @Query(() => ProjetoMarcoEntregaPainelType)
  projetoMarcosEntregas(
    @Args('projetoId') projetoId: string,
    @Args('incluirArquivados', { nullable: true, defaultValue: false }) incluirArquivados: boolean,
    @CurrentUser() user: JwtPayload
  ) {
    return this.projetosService.marcosEntregas(projetoId, incluirArquivados, user);
  }

  @Mutation(() => ProjetoMarcoType)
  createProjetoMarco(@Args('input') input: CreateProjetoMarcoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.createMarco(input, user);
  }

  @Mutation(() => ProjetoMarcoType)
  updateProjetoMarco(@Args('input') input: UpdateProjetoMarcoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.updateMarco(input, user);
  }

  @Mutation(() => ProjetoEntregaType)
  createProjetoEntrega(@Args('input') input: CreateProjetoEntregaInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.createEntrega(input, user);
  }

  @Mutation(() => ProjetoEntregaType)
  updateProjetoEntrega(@Args('input') input: UpdateProjetoEntregaInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.updateEntrega(input, user);
  }

  @Mutation(() => ProjetoMarcoType)
  arquivarProjetoMarco(@Args('input') input: VersionarProjetoCompromissoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.arquivarCompromisso('MARCO', input, user, false);
  }

  @Mutation(() => ProjetoMarcoType)
  reativarProjetoMarco(@Args('input') input: VersionarProjetoCompromissoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.arquivarCompromisso('MARCO', input, user, true);
  }

  @Mutation(() => ProjetoEntregaType)
  arquivarProjetoEntrega(@Args('input') input: VersionarProjetoCompromissoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.arquivarCompromisso('ENTREGA', input, user, false);
  }

  @Mutation(() => ProjetoEntregaType)
  reativarProjetoEntrega(@Args('input') input: VersionarProjetoCompromissoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.arquivarCompromisso('ENTREGA', input, user, true);
  }
}
