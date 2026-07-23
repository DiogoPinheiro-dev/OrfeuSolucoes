import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjetoItemHierarquiaService {
  async assertPaiValido(
    tx: Prisma.TransactionClient,
    projetoId: string,
    paiId?: string | null,
    itemId?: string
  ): Promise<void> {
    if (!paiId) return;

    if (itemId && paiId === itemId) {
      throw new BadRequestException('Um item nao pode ser pai de si mesmo.');
    }

    const pai = await tx.projetoItem.findUnique({
      where: { id: paiId },
      select: {
        id: true,
        projetoId: true,
        paiId: true,
        arquivadoEm: true
      }
    });

    if (!pai || pai.projetoId !== projetoId) {
      throw new BadRequestException(
        'O item pai deve pertencer ao mesmo projeto.'
      );
    }

    if (pai.arquivadoEm) {
      throw new BadRequestException('Um item arquivado nao pode receber subtarefas.');
    }

    if (pai.paiId) {
      throw new BadRequestException(
        'A hierarquia permite somente um nivel de subtarefas.'
      );
    }

    if (itemId) {
      const possuiSubtarefas = await tx.projetoItem.count({
        where: {
          paiId: itemId,
          arquivadoEm: null
        }
      });

      if (possuiSubtarefas) {
        throw new BadRequestException(
          'Um item com subtarefas nao pode se tornar uma subtarefa.'
        );
      }
    }
  }
}
