import { ForbiddenException } from '@nestjs/common';
import { UsuarioWithRole, UserGroupRecord } from '../types/user-record.types';

export function assertCanRemoveUser(user: UsuarioWithRole): void {
  if (user.padraoSistema) {
    throw new ForbiddenException('O usuario administrador padrao do sistema nao pode ser excluido. Altere seus dados quando necessario.');
  }
}

export function hasFullGroupAccess(
  grupo?: Pick<UserGroupRecord, 'acessoEcommerce' | 'acessoProjetos' | 'acessoHoras' | 'acessoConfigurador'> | null
): boolean {
  return !!(
    grupo?.acessoEcommerce &&
    grupo.acessoProjetos &&
    grupo.acessoHoras &&
    grupo.acessoConfigurador
  );
}

export function isSystemAdmin(user?: { login?: string | null } | null): boolean {
  return user?.login?.toLowerCase() === 'admin';
}

export function assertSystemAdmin(user?: { login?: string | null } | null): void {
  if (!isSystemAdmin(user)) {
    throw new ForbiddenException('Apenas o usuario administrador inicial pode acessar o configurador.');
  }
}
