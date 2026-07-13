import { ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '../../auth/strategies/jwt-payload.type';
import { GrupoUsuarioRecord } from '../types/grupo-usuario-record.types';

export function assertCanRemoveGrupo(grupo: GrupoUsuarioRecord): void {
  if (grupo.padraoSistema) {
    throw new ForbiddenException('O grupo Administradores padrao do sistema nao pode ser excluido. Altere seus dados quando necessario.');
  }
}

export function assertSystemAdmin(user: JwtPayload): void {
  if (user.login?.toLowerCase() !== 'admin') {
    throw new ForbiddenException('Apenas o usuario administrador inicial pode acessar o configurador.');
  }
}