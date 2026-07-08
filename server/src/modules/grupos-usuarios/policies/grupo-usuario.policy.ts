import { ForbiddenException } from '@nestjs/common';
import { GrupoUsuarioRecord } from '../types/grupo-usuario-record.types';

export function assertCanRemoveGrupo(grupo: GrupoUsuarioRecord): void {
  if (grupo.padraoSistema) {
    throw new ForbiddenException('O grupo Administradores padrao do sistema nao pode ser excluido. Altere seus dados quando necessario.');
  }
}
