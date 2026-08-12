import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { DocumentacaoService } from './documentacao.service';
import { DocumentacaoFiltroInput } from './dto/documentacao-filtro.input';
import { DocumentacaoArtigoType, DocumentacaoBuscaResultadoType, DocumentacaoItemType } from './dto/documentacao.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class DocumentacaoResolver {
  constructor(private readonly documentacaoService: DocumentacaoService) {}

  @Query(() => [DocumentacaoItemType])
  documentacaoIndice(@CurrentUser() user: JwtPayload, @Args('filtro', { nullable: true }) filtro?: DocumentacaoFiltroInput) {
    return this.documentacaoService.indice(user, filtro);
  }

  @Query(() => DocumentacaoArtigoType)
  documentacaoArtigo(@Args('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.documentacaoService.artigo(slug, user);
  }

  @Query(() => [DocumentacaoBuscaResultadoType])
  buscarDocumentacao(
    @Args('termo') termo: string,
    @CurrentUser() user: JwtPayload,
    @Args('filtro', { nullable: true }) filtro?: DocumentacaoFiltroInput
  ) {
    return this.documentacaoService.buscar(termo, user, filtro);
  }
}
