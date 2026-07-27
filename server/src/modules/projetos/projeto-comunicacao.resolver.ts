import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateProjetoAtualizacaoInput, CreateProjetoComentarioInput, ExcluirProjetoComentarioInput, UpdateProjetoAtualizacaoInput, UpdateProjetoComentarioInput } from './dto/projeto-comunicacao.input';
import { ProjetoAtualizacaoType, ProjetoComentarioType, ProjetoComunicacaoPainelType, ProjetoComunicacaoProjetoType } from './dto/projeto-comunicacao.type';
import { ProjetosService } from './projetos.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ProjetoComunicacaoResolver {
  constructor(private readonly projetosService: ProjetosService) {}

  @Query(() => [ProjetoComunicacaoProjetoType])
  projetoComunicacaoProjetos(@CurrentUser() user: JwtPayload) {
    return this.projetosService.comunicacaoProjetos(user);
  }
  @Query(() => ProjetoComunicacaoPainelType)
  projetoComunicacao(@Args('projetoId') projetoId: string, @CurrentUser() user: JwtPayload) {
    return this.projetosService.comunicacao(projetoId, user);
  }

  @Mutation(() => ProjetoAtualizacaoType)
  createProjetoAtualizacao(@Args('input') input: CreateProjetoAtualizacaoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.createAtualizacao(input, user);
  }

  @Mutation(() => ProjetoAtualizacaoType)
  updateProjetoAtualizacao(@Args('input') input: UpdateProjetoAtualizacaoInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.updateAtualizacao(input, user);
  }

  @Mutation(() => ProjetoComentarioType)
  createProjetoComentario(@Args('input') input: CreateProjetoComentarioInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.createComentario(input, user);
  }

  @Mutation(() => ProjetoComentarioType)
  updateProjetoComentario(@Args('input') input: UpdateProjetoComentarioInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.updateComentario(input, user);
  }

  @Mutation(() => ProjetoComentarioType)
  excluirProjetoComentario(@Args('input') input: ExcluirProjetoComentarioInput, @CurrentUser() user: JwtPayload) {
    return this.projetosService.excluirComentario(input, user);
  }
}