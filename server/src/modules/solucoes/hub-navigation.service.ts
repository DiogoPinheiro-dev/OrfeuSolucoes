import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { withAllPermissions, withPermissions } from './mappers/funcionalidade.mapper';
import { canAccessFeature, canAccessSolution, hasFullAccessGroup, isSystemAdmin } from './policies/solucao-access.policy';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { SolucaoQueryService } from './solucao-query.service';
import { SolucaoType } from './dto/solucao.type';

@Injectable()
export class HubNavigationService {
  constructor(
    private readonly solucaoAcessoService: SolucaoAcessoService,
    private readonly solucaoQueryService: SolucaoQueryService
  ) {}

  async myHubNavigation(user: JwtPayload): Promise<SolucaoType[]> {
    const solucoes = await this.solucaoQueryService.findAll();
    const groupSolutionIds = await this.solucaoAcessoService.findGroupSolutionIds(user.grupo?.id);
    const groupFeaturePermissions = await this.solucaoAcessoService.findGroupFeaturePermissions(user.grupo?.id);
    const companySolutionIds = await this.solucaoAcessoService.findCompanySolutionIds(user.empresaId);
    const companyFeatureIds = await this.solucaoAcessoService.findCompanyFeatureIds(user.empresaId);
    const systemAdmin = isSystemAdmin(user);
    const fullAccessGroup = hasFullAccessGroup(user.grupo);

    return solucoes
      .filter((solucao) => solucao.statusPublicacao === 'PUBLICADA' && solucao.ativo && solucao.exibirNoHub)
      .filter((solucao) => canAccessSolution({
        solutionSlug: solucao.slug,
        systemAdminOnly: solucao.somenteAdminSistema,
        systemAdmin,
        fullAccessGroup,
        groupHasSolution: groupSolutionIds.has(solucao.id),
        companyHasSolution: companySolutionIds.has(solucao.id)
      }))
      .map((solucao) => ({
        ...solucao,
        funcionalidades: solucao.funcionalidades
          .filter((funcionalidade) => funcionalidade.statusPublicacao === 'PUBLICADA' && funcionalidade.ativo)
          .filter((funcionalidade) => canAccessFeature({
            systemAdminOnly: solucao.somenteAdminSistema || funcionalidade.somenteAdminSistema,
            systemAdmin,
            fullAccessGroup,
            groupCanView: !!groupFeaturePermissions.get(funcionalidade.id)?.podeVisualizar,
            companyHasFeature: companyFeatureIds.has(funcionalidade.id)
          }))
          .map((funcionalidade) => {
            const publishedFeature = {
              ...funcionalidade,
              acoes: funcionalidade.acoes.filter((acao) => acao.ativo && acao.statusPublicacao === 'PUBLICADA')
            };
            if (systemAdmin || fullAccessGroup) {
              return withAllPermissions(publishedFeature);
            }

            return withPermissions(publishedFeature, groupFeaturePermissions.get(funcionalidade.id));
          })
      }));
  }

  async resolveAvailableSolutionSlugs(user: { padraoSistema?: boolean | null; grupo?: { id?: number | null } | null }, empresaId?: number | null): Promise<string[]> {
    const navigation = await this.myHubNavigation({
      sub: '',
      email: '',
      padraoSistema: user.padraoSistema ?? false,
      grupo: user.grupo?.id ? { id: user.grupo.id, nome: '', acessoEcommerce: false, acessoProjetos: false, acessoHoras: false, acessoConfigurador: false } : null,
      empresaId: empresaId ?? null
    });

    return navigation.map((solucao) => solucao.slug);
  }

}
