import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadosService } from './chamados.service';
import { AlterarPrioridadeChamadoInput } from './dto/alterar-prioridade-chamado.input';
import { AlterarStatusChamadoInput } from './dto/alterar-status-chamado.input';
import { AtribuirChamadoInput } from './dto/atribuir-chamado.input';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { ChamadoFiltroInput } from './dto/chamado-filtro.input';
import { ChamadoPageType, ChamadoType } from './dto/chamado.type';
import { CriarChamadoInput } from './dto/criar-chamado.input';
import { ResponderChamadoInput } from './dto/responder-chamado.input';

@UseGuards(GqlAuthGuard)
@Resolver(() => ChamadoType)
export class ChamadosResolver {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Query(() => ChamadoPageType)
  meusChamados(
    @CurrentUser() user: JwtPayload,
    @Args('filtro', { type: () => ChamadoFiltroInput, nullable: true }) filtro?: ChamadoFiltroInput
  ): Promise<ChamadoPageType> {
    return this.chamadosService.meusChamados(user, filtro);
  }

  @Query(() => ChamadoPageType)
  filaChamados(
    @CurrentUser() user: JwtPayload,
    @Args('filtro', { type: () => ChamadoFiltroInput, nullable: true }) filtro?: ChamadoFiltroInput
  ): Promise<ChamadoPageType> {
    return this.chamadosService.filaChamados(user, filtro);
  }

  @Query(() => ChamadoType)
  chamado(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.chamado(id, user);
  }

  @Query(() => [ChamadoCategoriaType])
  categoriasChamado(
    @CurrentUser() user: JwtPayload,
    @Args('ativas', { type: () => Boolean, nullable: true, defaultValue: true }) ativas?: boolean
  ): Promise<ChamadoCategoriaType[]> {
    return this.chamadosService.categoriasChamado(user, ativas ?? true);
  }

  @Query(() => [AtendenteChamadoType])
  atendentesDisponiveis(@CurrentUser() user: JwtPayload): Promise<AtendenteChamadoType[]> {
    return this.chamadosService.atendentesDisponiveis(user);
  }

  @Mutation(() => ChamadoType)
  criarChamado(
    @Args('input') input: CriarChamadoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.criarChamado(input, user);
  }

  @Mutation(() => ChamadoType)
  responderChamado(
    @Args('input') input: ResponderChamadoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.responderChamado(input, user);
  }

  @Mutation(() => ChamadoType)
  assumirChamado(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.assumirChamado(id, user);
  }

  @Mutation(() => ChamadoType)
  atribuirChamado(
    @Args('input') input: AtribuirChamadoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.atribuirChamado(input, user);
  }

  @Mutation(() => ChamadoType)
  alterarStatusChamado(
    @Args('input') input: AlterarStatusChamadoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.alterarStatusChamado(input, user);
  }

  @Mutation(() => ChamadoType)
  alterarPrioridadeChamado(
    @Args('input') input: AlterarPrioridadeChamadoInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoType> {
    return this.chamadosService.alterarPrioridadeChamado(input, user);
  }

  @Mutation(() => ChamadoType)
  resolverChamado(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Args('observacao', { type: () => String, nullable: true }) observacao?: string
  ): Promise<ChamadoType> {
    return this.chamadosService.resolverChamado(id, user, observacao);
  }

  @Mutation(() => ChamadoType)
  encerrarChamado(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Args('observacao', { type: () => String, nullable: true }) observacao?: string
  ): Promise<ChamadoType> {
    return this.chamadosService.encerrarChamado(id, user, observacao);
  }

  @Mutation(() => ChamadoType)
  reabrirChamado(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Args('observacao', { type: () => String, nullable: true }) observacao?: string
  ): Promise<ChamadoType> {
    return this.chamadosService.reabrirChamado(id, user, observacao);
  }

  @Mutation(() => ChamadoCategoriaType)
  createChamadoCategoria(
    @Args('input') input: CreateChamadoCategoriaInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoCategoriaType> {
    return this.chamadosService.createCategoria(input, user);
  }

  @Mutation(() => ChamadoCategoriaType)
  updateChamadoCategoria(
    @Args('input') input: UpdateChamadoCategoriaInput,
    @CurrentUser() user: JwtPayload
  ): Promise<ChamadoCategoriaType> {
    return this.chamadosService.updateCategoria(input, user);
  }

  @Mutation(() => Boolean)
  deleteChamadoCategoria(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: JwtPayload
  ): Promise<boolean> {
    return this.chamadosService.deleteCategoria(id, user);
  }
}
