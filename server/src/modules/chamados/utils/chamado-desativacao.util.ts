import { BadRequestException } from '@nestjs/common';

export function assertRegistroAtivoParaDesativacao(registro: { ativo: boolean }): void {
  if (!registro.ativo) {
    throw new BadRequestException('Este registro já está inativo.');
  }
}
