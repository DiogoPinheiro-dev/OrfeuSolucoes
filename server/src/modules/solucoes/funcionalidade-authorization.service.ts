import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from './solucoes.service';

export type FullAccessGroup = {
  acessoEcommerce?: boolean | null;
  acessoProjetos?: boolean | null;
  acessoHoras?: boolean | null;
  acessoConfigurador?: boolean | null;
};

@Injectable()
export class FuncionalidadeAuthorizationService {
  constructor(private readonly solucoesService: SolucoesService) {}

  async assertFeatureAction(user: JwtPayload, solutionSlug: string, featureSlug: string, action: string): Promise<void> {
    if (this.isSystemAdmin(user) || this.hasFullAccessGroup(user.grupo)) {
      return;
    }

    const navigation = await this.solucoesService.myHubNavigation(user);
    const solution = navigation.find((item) => item.slug === solutionSlug);
    const feature = solution?.funcionalidades.find((item) => item.slug === featureSlug);

    if (!solution || !feature || feature.podeVisualizar === false) {
      throw new ForbiddenException('Usuario sem permissao para acessar esta funcionalidade.');
    }

    const requestedAction = this.normalizeActionIdentifier(action);
    const dynamicAction = feature.acoes.find((item) =>
      this.normalizeActionIdentifier(item.chave) === requestedAction ||
      this.normalizeActionIdentifier(item.configuracao ?? '') === requestedAction
    );

    if (dynamicAction) {
      if (!dynamicAction.permitido) {
        throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
      }

      return;
    }

    const legacyPermission = {
      visualizar: feature.podeVisualizar,
      incluir: feature.podeIncluir,
      alterar: feature.podeAlterar,
      excluir: feature.podeExcluir
    }[action];

    if (!legacyPermission) {
      throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
    }
  }

  async canFeatureAction(user: JwtPayload, solutionSlug: string, featureSlug: string, action: string): Promise<boolean> {
    try {
      await this.assertFeatureAction(user, solutionSlug, featureSlug, action);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return false;
      }

      throw error;
    }
  }

  isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  hasFullAccessGroup(grupo?: FullAccessGroup | null): boolean {
    return !!(
      grupo?.acessoEcommerce &&
      grupo.acessoProjetos &&
      grupo.acessoHoras &&
      grupo.acessoConfigurador
    );
  }

  private normalizeActionIdentifier(value?: string | null): string {
    return (value ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
