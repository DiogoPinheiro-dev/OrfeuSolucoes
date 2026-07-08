import { ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '../../auth/strategies/jwt-payload.type';
import { EmpresaRecord } from '../types/empresa-record.types';

export function assertCanRemoveEmpresa(empresa: EmpresaRecord): void {
  if (empresa.padraoSistema) {
    throw new ForbiddenException('A empresa padrao do sistema nao pode ser excluida. Altere seus dados quando necessario.');
  }
}

export function assertAdmin(user: JwtPayload, action: string): void {
  if (user.login?.toLowerCase() !== 'admin') {
    throw new ForbiddenException(`Apenas o usuario administrador inicial pode ${action}.`);
  }
}

export function hasFullGroupAccess(
  grupo?: {
    acessoEcommerce?: boolean;
    acessoProjetos?: boolean;
    acessoHoras?: boolean;
    acessoConfigurador?: boolean;
  } | null
): boolean {
  return !!(
    grupo?.acessoEcommerce &&
    grupo.acessoProjetos &&
    grupo.acessoHoras &&
    grupo.acessoConfigurador
  );
}
