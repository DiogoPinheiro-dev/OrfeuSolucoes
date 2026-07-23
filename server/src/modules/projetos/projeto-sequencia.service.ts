import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjetoSequenciaService {
  async reservar(
    tx: Prisma.TransactionClient,
    projetoId: string,
    namespace: string
  ): Promise<number> {
    const normalizedNamespace = namespace.trim().toUpperCase();

    if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(normalizedNamespace)) {
      throw new BadRequestException('Namespace de sequencia invalido.');
    }

    const sequencia = await tx.projetoSequencia.upsert({
      where: {
        projetoId_namespace: {
          projetoId,
          namespace: normalizedNamespace
        }
      },
      create: {
        projetoId,
        namespace: normalizedNamespace,
        proximoNumero: 2
      },
      update: {
        proximoNumero: { increment: 1 }
      }
    });

    return sequencia.proximoNumero - 1;
  }
}

