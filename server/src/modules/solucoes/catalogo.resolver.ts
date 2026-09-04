import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CatalogoLifecycleService } from './catalogo-lifecycle.service';
import { CatalogoProviderType, CatalogoValidationIssueType, CatalogoVersaoType } from './dto/catalogo-lifecycle.type';
import { CatalogoProviderRegistry } from './catalogo-provider.registry';
import { assertSystemAdmin } from './policies/solucao-access.policy';
import { UpdateCatalogoFuncionalidadeDraftInput } from './dto/update-catalogo-funcionalidade-draft.input';
import { UpdateCatalogoSolucaoDraftInput } from './dto/update-catalogo-solucao-draft.input';
import { UpdateCatalogoAcaoDraftInput } from './dto/update-catalogo-acao-draft.input';

@Resolver(() => CatalogoVersaoType)
@UseGuards(GqlAuthGuard)
export class CatalogoResolver {
  constructor(
    private readonly lifecycle: CatalogoLifecycleService,
    private readonly providers: CatalogoProviderRegistry
  ) {}

  @Query(() => [CatalogoProviderType])
  catalogoProviders(@CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.providers.list();
  }

  @Query(() => CatalogoVersaoType, { nullable: true })
  catalogoRascunhoFuncionalidade(@Args('funcionalidadeId', { type: () => Int }) funcionalidadeId: number, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.findFeatureDraft(funcionalidadeId);
  }

  @Query(() => CatalogoVersaoType, { nullable: true })
  catalogoRascunhoAcao(@Args('acaoId', { type: () => Int }) acaoId: number, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.findActionDraft(acaoId);
  }

  @Mutation(() => CatalogoVersaoType)
  criarRascunhoSolucao(@Args('solucaoId', { type: () => Int }) solucaoId: number, @Args('motivo', { type: () => String, nullable: true }) motivo: string | undefined, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.createSolutionDraft(solucaoId, user.sub, motivo);
  }

  @Mutation(() => CatalogoVersaoType)
  salvarRascunhoSolucao(@Args('input', { type: () => UpdateCatalogoSolucaoDraftInput }) input: UpdateCatalogoSolucaoDraftInput, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.updateSolutionDraft(input, user.sub);
  }

  @Mutation(() => CatalogoVersaoType)
  publicarRascunhoSolucao(@Args('versaoId', { type: () => String }) versaoId: string, @Args('revisaoEsperada', { type: () => Int }) revisaoEsperada: number, @Args('motivo', { type: () => String, nullable: true }) motivo: string | undefined, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.publishSolutionDraft(versaoId, revisaoEsperada, user.sub, motivo);
  }

  @Mutation(() => Boolean)
  async despublicarSolucao(@Args('solucaoId', { type: () => Int }) solucaoId: number, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload): Promise<boolean> {
    assertSystemAdmin(user);
    await this.lifecycle.unpublishSolution(solucaoId, user.sub, motivo);
    return true;
  }

  @Mutation(() => CatalogoVersaoType)
  restaurarVersaoSolucao(@Args('versaoId', { type: () => String }) versaoId: string, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.restoreSolutionVersion(versaoId, user.sub, motivo);
  }

  @Mutation(() => CatalogoVersaoType)
  restaurarPadraoSolucao(@Args('solucaoId', { type: () => Int }) solucaoId: number, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.restoreSolutionBaseline(solucaoId, user.sub, motivo);
  }

  @Mutation(() => CatalogoVersaoType)
  criarRascunhoFuncionalidade(@Args('funcionalidadeId', { type: () => Int }) funcionalidadeId: number, @Args('motivo', { type: () => String, nullable: true }) motivo: string | undefined, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.createFeatureDraft(funcionalidadeId, user.sub, motivo);
  }

  @Query(() => [CatalogoValidationIssueType])
  validarRascunhoFuncionalidade(@Args('versaoId', { type: () => String }) versaoId: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.validateFeatureDraft(versaoId);
  }

  @Mutation(() => CatalogoVersaoType)
  salvarRascunhoFuncionalidade(@Args('input', { type: () => UpdateCatalogoFuncionalidadeDraftInput }) input: UpdateCatalogoFuncionalidadeDraftInput, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.updateFeatureDraft(input, user.sub);
  }

  @Mutation(() => CatalogoVersaoType)
  publicarRascunhoFuncionalidade(@Args('versaoId', { type: () => String }) versaoId: string, @Args('revisaoEsperada', { type: () => Int }) revisaoEsperada: number, @Args('motivo', { type: () => String, nullable: true }) motivo: string | undefined, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.publishFeatureDraft(versaoId, revisaoEsperada, user.sub, motivo);
  }

  @Mutation(() => Boolean)
  async despublicarFuncionalidade(@Args('funcionalidadeId', { type: () => Int }) funcionalidadeId: number, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload): Promise<boolean> {
    assertSystemAdmin(user);
    await this.lifecycle.unpublishFeature(funcionalidadeId, user.sub, motivo);
    return true;
  }

  @Mutation(() => CatalogoVersaoType)
  restaurarVersaoFuncionalidade(@Args('versaoId', { type: () => String }) versaoId: string, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.restoreFeatureVersion(versaoId, user.sub, motivo);
  }

  @Mutation(() => CatalogoVersaoType)
  restaurarPadraoFuncionalidade(@Args('funcionalidadeId', { type: () => Int }) funcionalidadeId: number, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.restoreFeatureBaseline(funcionalidadeId, user.sub, motivo);
  }

  @Mutation(() => CatalogoVersaoType)
  criarRascunhoAcao(@Args('acaoId', { type: () => Int }) acaoId: number, @Args('motivo', { type: () => String, nullable: true }) motivo: string | undefined, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.createActionDraft(acaoId, user.sub, motivo);
  }

  @Query(() => [CatalogoValidationIssueType])
  validarRascunhoAcao(@Args('versaoId', { type: () => String }) versaoId: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.validateActionDraft(versaoId);
  }

  @Mutation(() => CatalogoVersaoType)
  salvarRascunhoAcao(@Args('input', { type: () => UpdateCatalogoAcaoDraftInput }) input: UpdateCatalogoAcaoDraftInput, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.updateActionDraft(input, user.sub);
  }

  @Mutation(() => CatalogoVersaoType)
  publicarRascunhoAcao(@Args('versaoId', { type: () => String }) versaoId: string, @Args('revisaoEsperada', { type: () => Int }) revisaoEsperada: number, @Args('motivo', { type: () => String, nullable: true }) motivo: string | undefined, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.publishActionDraft(versaoId, revisaoEsperada, user.sub, motivo);
  }

  @Mutation(() => Boolean)
  async despublicarAcao(@Args('acaoId', { type: () => Int }) acaoId: number, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload): Promise<boolean> {
    assertSystemAdmin(user);
    await this.lifecycle.unpublishAction(acaoId, user.sub, motivo);
    return true;
  }

  @Mutation(() => CatalogoVersaoType)
  restaurarVersaoAcao(@Args('versaoId', { type: () => String }) versaoId: string, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.restoreActionVersion(versaoId, user.sub, motivo);
  }

  @Mutation(() => CatalogoVersaoType)
  restaurarPadraoAcao(@Args('acaoId', { type: () => Int }) acaoId: number, @Args('motivo', { type: () => String }) motivo: string, @CurrentUser() user: JwtPayload) {
    assertSystemAdmin(user);
    return this.lifecycle.restoreActionBaseline(acaoId, user.sub, motivo);
  }
}
