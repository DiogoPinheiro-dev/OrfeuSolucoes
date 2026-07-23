import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type ProjetoAuditoriaInput = {
  empresaId: number;
  projetoId: string;
  usuarioId?: string | null;
  entidade: string;
  entidadeId: string;
  evento: string;
  dados?: unknown;
};

@Injectable()
export class ProjetoAuditoriaService {
  registrar(
    tx: Prisma.TransactionClient,
    input: ProjetoAuditoriaInput
  ): Promise<unknown> {
    return tx.projetoEvento.create({
      data: {
        empresaId: input.empresaId,
        projetoId: input.projetoId,
        usuarioId: input.usuarioId ?? null,
        entidade: input.entidade,
        entidadeId: input.entidadeId,
        evento: input.evento,
        dados: input.dados === undefined ? null : JSON.stringify(input.dados)
      }
    });
  }
}

