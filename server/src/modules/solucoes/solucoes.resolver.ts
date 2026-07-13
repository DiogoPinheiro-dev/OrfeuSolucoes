import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateFuncionalidadeInput } from './dto/create-funcionalidade.input';
import { CreateSolucaoInput } from './dto/create-solucao.input';
import { FuncionalidadeType } from './dto/funcionalidade.type';
import { SolucaoType } from './dto/solucao.type';
import { UpdateFuncionalidadeInput } from './dto/update-funcionalidade.input';
import { UpdateSolucaoInput } from './dto/update-solucao.input';
import { assertSystemAdmin } from './policies/solucao-access.policy';
import { SolucoesService } from './solucoes.service';

@Resolver(() => SolucaoType)
export class SolucoesResolver {
  constructor(private readonly solucoesService: SolucoesService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [SolucaoType])
  myHubNavigation(@CurrentUser() user: JwtPayload): Promise<SolucaoType[]> {
    return this.solucoesService.myHubNavigation(user);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [SolucaoType])
  solucoes(@CurrentUser() user: JwtPayload): Promise<SolucaoType[]> {
    assertSystemAdmin(user);
    return this.solucoesService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => SolucaoType)
  createSolucao(
    @Args('input') input: CreateSolucaoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<SolucaoType> {
    assertSystemAdmin(user);
    return this.solucoesService.create(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => SolucaoType)
  updateSolucao(
    @Args('input') input: UpdateSolucaoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<SolucaoType> {
    assertSystemAdmin(user);
    return this.solucoesService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteSolucao(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    assertSystemAdmin(user);
    return this.solucoesService.remove(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => FuncionalidadeType)
  createFuncionalidade(
    @Args('input') input: CreateFuncionalidadeInput,
    @CurrentUser() user: JwtPayload
  ): Promise<FuncionalidadeType> {
    assertSystemAdmin(user);
    return this.solucoesService.createFuncionalidade(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => FuncionalidadeType)
  updateFuncionalidade(
    @Args('input') input: UpdateFuncionalidadeInput,
    @CurrentUser() user: JwtPayload
  ): Promise<FuncionalidadeType> {
    assertSystemAdmin(user);
    return this.solucoesService.updateFuncionalidade(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteFuncionalidade(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    assertSystemAdmin(user);
    return this.solucoesService.removeFuncionalidade(id);
  }

}
