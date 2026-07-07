import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { withAllPermissions, withPermissions } from './mappers/funcionalidade.mapper';
import { hasFullAccessGroup, isSystemAdmin } from './policies/solucao-access.policy';
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
    const canBypassAccessRules = systemAdmin || hasFullAccessGroup(user.grupo);

    return solucoes
      .filter((solucao) => solucao.ativo && solucao.exibirNoHub)
      .filter((solucao) => {
        if (solucao.somenteAdminSistema) {
          return systemAdmin;
        }

        if (canBypassAccessRules) {
          return true;
        }

        return groupSolutionIds.has(solucao.id) && companySolutionIds.has(solucao.id);
      })
      .map((solucao) => ({
        ...solucao,
        funcionalidades: solucao.funcionalidades
          .filter((funcionalidade) => funcionalidade.ativo)
          .filter((funcionalidade) => {
            if (solucao.somenteAdminSistema || funcionalidade.somenteAdminSistema) {
              return systemAdmin;
            }

            if (canBypassAccessRules) {
              return true;
            }

            const permissao = groupFeaturePermissions.get(funcionalidade.id);

            return !!permissao?.podeVisualizar && companyFeatureIds.has(funcionalidade.id);
          })
          .map((funcionalidade) => {
            if (canBypassAccessRules) {
              return withAllPermissions(funcionalidade);
            }

            return withPermissions(funcionalidade, groupFeaturePermissions.get(funcionalidade.id));
          })
      }));
  }

  async resolveAvailableSolutionSlugs(user: { login?: string | null; grupo?: { id?: number | null } | null }, empresaId?: number | null): Promise<string[]> {
    const navigation = await this.myHubNavigation({
      sub: '',
      email: '',
      login: user.login ?? null,
      grupo: user.grupo?.id ? { id: user.grupo.id, nome: '', acessoEcommerce: false, acessoProjetos: false, acessoHoras: false, acessoConfigurador: false } : null,
      empresaId: empresaId ?? null
    });

    return navigation.map((solucao) => solucao.slug);
  }

}
