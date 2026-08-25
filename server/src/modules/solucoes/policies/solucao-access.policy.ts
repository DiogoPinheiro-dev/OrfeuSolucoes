import { ForbiddenException } from '@nestjs/common';

export function isSystemAdmin(user?: { padraoSistema?: boolean | null } | null): boolean {
  return user?.padraoSistema === true;
}

export function hasFullAccessGroup(grupo?: {
  acessoEcommerce?: boolean | null;
  acessoProjetos?: boolean | null;
  acessoHoras?: boolean | null;
  acessoConfigurador?: boolean | null;
} | null): boolean {
  return !!(
    grupo?.acessoEcommerce &&
    grupo.acessoProjetos &&
    grupo.acessoHoras &&
    grupo.acessoConfigurador
  );
}

type SolutionAccessPolicyInput = {
  solutionSlug: string;
  systemAdminOnly: boolean;
  systemAdmin: boolean;
  fullAccessGroup: boolean;
  groupHasSolution: boolean;
  companyHasSolution: boolean;
};

type FeatureAccessPolicyInput = {
  systemAdminOnly: boolean;
  systemAdmin: boolean;
  fullAccessGroup: boolean;
  groupCanView: boolean;
  companyHasFeature: boolean;
};

export function canAccessSolution({
  solutionSlug,
  systemAdminOnly,
  systemAdmin,
  fullAccessGroup,
  groupHasSolution,
  companyHasSolution
}: SolutionAccessPolicyInput): boolean {
  if (solutionSlug === 'documentacao') {
    return true;
  }

  if (systemAdminOnly) {
    return systemAdmin;
  }

  return companyHasSolution && (systemAdmin || fullAccessGroup || groupHasSolution);
}

export function canAccessFeature({
  systemAdminOnly,
  systemAdmin,
  fullAccessGroup,
  groupCanView,
  companyHasFeature
}: FeatureAccessPolicyInput): boolean {
  if (systemAdminOnly) {
    return systemAdmin;
  }

  return companyHasFeature && (systemAdmin || fullAccessGroup || groupCanView);
}

export function assertSystemAdmin(user?: { padraoSistema?: boolean | null } | null): void {
  if (!isSystemAdmin(user)) {
    throw new ForbiddenException('Apenas o usuario administrador inicial pode configurar solucoes.');
  }
}
