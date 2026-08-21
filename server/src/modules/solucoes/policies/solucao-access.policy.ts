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

export function assertSystemAdmin(user?: { padraoSistema?: boolean | null } | null): void {
  if (!isSystemAdmin(user)) {
    throw new ForbiddenException('Apenas o usuario administrador inicial pode configurar solucoes.');
  }
}
