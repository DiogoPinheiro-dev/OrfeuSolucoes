import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { FuncionalidadeAuthorizationService } from '../solucoes/funcionalidade-authorization.service';
import { ProjetoPapel, ProjetoPermissoesEfetivas, ProjetoRecord } from './types/projeto.types';

const SOLUTION_SLUG = 'projetos';
const FEATURE_SLUG = 'cadastro-de-projetos';

@Injectable()
export class ProjetoAuthorizationService {
  constructor(private readonly funcionalidadeAuthorization: FuncionalidadeAuthorizationService) {}

  assertCompanyContext(user: JwtPayload): number {
    if (!user?.empresaId) {
      throw new ForbiddenException('Selecione uma empresa para acessar os projetos.');
    }

    return user.empresaId;
  }

  async assertReadAccess(user: JwtPayload): Promise<number> {
    const empresaId = this.assertCompanyContext(user);
    await this.funcionalidadeAuthorization.assertFeatureAction(user, SOLUTION_SLUG, FEATURE_SLUG, 'visualizar');
    return empresaId;
  }

  async assertCreateAccess(user: JwtPayload): Promise<number> {
    const empresaId = this.assertCompanyContext(user);
    await this.funcionalidadeAuthorization.assertFeatureAction(user, SOLUTION_SLUG, FEATURE_SLUG, 'incluir');
    return empresaId;
  }
  visibilityWhere(user: JwtPayload): Prisma.ProjetoWhereInput {
    if (this.isSystemAdmin(user)) {
      return {};
    }

    return {
      OR: [
        { responsavelId: user.sub },
        { membros: { some: { usuarioId: user.sub } } }
      ]
    };
  }

  assertVisibleProject(projeto: ProjetoRecord | null, user: JwtPayload, empresaId: number): asserts projeto is ProjetoRecord {
    if (!projeto || projeto.empresaId !== empresaId) {
      throw new NotFoundException('Projeto nao encontrado.');
    }

    if (this.isSystemAdmin(user) || projeto.responsavelId === user.sub || projeto.membros.some((item) => item.usuarioId === user.sub)) {
      return;
    }

    throw new NotFoundException('Projeto nao encontrado.');
  }

  async resolveFunctionalPermissions(user: JwtPayload): Promise<Record<string, boolean>> {
    const actions = ['alterar', 'gerenciar_membros', 'alterar_status', 'excluir', 'reativar_projeto'];
    const entries = await Promise.all(actions.map(async (action) => [
      action,
      await this.funcionalidadeAuthorization.canFeatureAction(user, SOLUTION_SLUG, FEATURE_SLUG, action)
    ] as const));

    return Object.fromEntries(entries);
  }

  async assertCanEdit(user: JwtPayload, papel: ProjetoPapel | null): Promise<void> {
    if (this.isSystemAdmin(user)) {
      return;
    }

    if (papel !== ProjetoPapel.RESPONSAVEL && papel !== ProjetoPapel.MEMBRO) {
      throw new ForbiddenException('Usuario sem permissao para alterar este projeto.');
    }

    await this.funcionalidadeAuthorization.assertFeatureAction(user, SOLUTION_SLUG, FEATURE_SLUG, 'alterar');
  }
  async assertCanManageTeam(user: JwtPayload, papel: ProjetoPapel | null): Promise<void> {
    await this.assertRoleAction(user, papel, [ProjetoPapel.RESPONSAVEL], 'gerenciar_membros', 'gerenciar a equipe');
  }

  async assertCanChangeStatus(user: JwtPayload, papel: ProjetoPapel | null): Promise<void> {
    await this.assertRoleAction(user, papel, [ProjetoPapel.RESPONSAVEL, ProjetoPapel.MEMBRO], 'alterar_status', 'alterar o ciclo de vida');
  }

  async assertCanArchive(user: JwtPayload, papel: ProjetoPapel | null): Promise<void> {
    await this.assertRoleAction(user, papel, [ProjetoPapel.RESPONSAVEL], 'excluir', 'arquivar');
  }

  async assertCanReactivate(user: JwtPayload, papel: ProjetoPapel | null): Promise<void> {
    await this.assertRoleAction(user, papel, [ProjetoPapel.RESPONSAVEL], 'reativar_projeto', 'reativar');
  }
  effectivePermissions(
    user: JwtPayload,
    papel: ProjetoPapel | null,
    functional: Record<string, boolean>
  ): ProjetoPermissoesEfetivas {
    if (this.isSystemAdmin(user)) {
      return {
        podeVisualizar: true,
        podeAlterar: true,
        podeGerenciarMembros: true,
        podeAlterarStatus: true,
        podeArquivar: true,
        podeReativar: true
      };
    }

    const responsavel = papel === ProjetoPapel.RESPONSAVEL;
    const membro = papel === ProjetoPapel.MEMBRO;

    return {
      podeVisualizar: !!papel,
      podeAlterar: (responsavel || membro) && !!functional.alterar,
      podeGerenciarMembros: responsavel && !!functional.gerenciar_membros,
      podeAlterarStatus: (responsavel || membro) && !!functional.alterar_status,
      podeArquivar: responsavel && !!functional.excluir,
      podeReativar: responsavel && !!functional.reativar_projeto
    };
  }

  private async assertRoleAction(
    user: JwtPayload,
    papel: ProjetoPapel | null,
    allowedRoles: ProjetoPapel[],
    action: string,
    operation: string
  ): Promise<void> {
    if (this.isSystemAdmin(user)) {
      return;
    }

    if (!papel || !allowedRoles.includes(papel)) {
      throw new ForbiddenException(`Usuario sem permissao para ${operation} este projeto.`);
    }

    await this.funcionalidadeAuthorization.assertFeatureAction(user, SOLUTION_SLUG, FEATURE_SLUG, action);
  }
  isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return this.funcionalidadeAuthorization.isSystemAdmin(user);
  }

  groupHasProjectAccess(grupo?: {
    acessoEcommerce?: boolean | null;
    acessoProjetos?: boolean | null;
    acessoHoras?: boolean | null;
    acessoConfigurador?: boolean | null;
    solucoes?: Array<{ solucao?: { slug: string } | null }>;
    funcionalidades?: Array<{ funcionalidade?: { solucao?: { slug: string } | null } | null }>;
  } | null): boolean {
    return !!grupo && (
      this.funcionalidadeAuthorization.hasFullAccessGroup(grupo) ||
      (grupo.solucoes ?? []).some((item) => item.solucao?.slug === SOLUTION_SLUG) ||
      (grupo.funcionalidades ?? []).some((item) => item.funcionalidade?.solucao?.slug === SOLUTION_SLUG)
    );
  }
}
