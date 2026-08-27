import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertProjetoDependenciaSemCiclo } from './policies/projeto-dependencia.policy';

@Injectable()
export class ProjetoItemHierarquiaService {
  async garantirDependenciaPaiFilho(
    tx: Prisma.TransactionClient,
    input: {
      empresaId: number;
      projetoId: string;
      paiId?: string | null;
      filhoId: string;
      usuarioId: string;
    }
  ): Promise<{ id: string; evento: 'CRIADA' | 'REATIVADA' } | null> {
    if (!input.paiId) return null;

    const existente = await tx.projetoItemDependencia.findFirst({
      where: {
        projetoId: input.projetoId,
        bloqueadorId: input.paiId,
        bloqueadoId: input.filhoId
      }
    });

    if (!existente) {
      await this.assertDependenciaSemCiclo(
        tx,
        input.projetoId,
        input.paiId,
        input.filhoId
      );
      const criada = await tx.projetoItemDependencia.create({
        data: {
          empresaId: input.empresaId,
          projetoId: input.projetoId,
          bloqueadorId: input.paiId,
          bloqueadoId: input.filhoId,
          criadoPorId: input.usuarioId
        }
      });
      return { id: criada.id, evento: 'CRIADA' };
    }

    if (!existente.arquivadoEm) return null;

    await this.assertDependenciaSemCiclo(
      tx,
      input.projetoId,
      input.paiId,
      input.filhoId
    );

    const reativada = await tx.projetoItemDependencia.update({
      where: { id: existente.id },
      data: {
        arquivadoEm: null,
        arquivadoPorId: null,
        versao: { increment: 1 }
      }
    });
    return { id: reativada.id, evento: 'REATIVADA' };
  }

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

    const visitados = new Set<string>();
    let ancestralId: string | null = paiId;

    while (ancestralId) {
      if (visitados.has(ancestralId)) {
        throw new BadRequestException(
          'A hierarquia existente contem um ciclo e precisa ser corrigida.'
        );
      }
      visitados.add(ancestralId);

      if (itemId && ancestralId === itemId) {
        throw new BadRequestException(
          'Um descendente do item nao pode ser selecionado como pai.'
        );
      }

      const ancestral: {
        id: string;
        projetoId: string;
        paiId: string | null;
        arquivadoEm: Date | null;
      } | null = await tx.projetoItem.findUnique({
        where: { id: ancestralId },
        select: {
          id: true,
          projetoId: true,
          paiId: true,
          arquivadoEm: true
        }
      });

      if (!ancestral || ancestral.projetoId !== projetoId) {
        throw new BadRequestException(
          'O item pai e seus ancestrais devem pertencer ao mesmo projeto.'
        );
      }

      if (ancestral.arquivadoEm) {
        throw new BadRequestException(
          'Um item arquivado nao pode fazer parte da cadeia hierarquica.'
        );
      }

      ancestralId = ancestral.paiId;
    }
  }

  private async assertDependenciaSemCiclo(
    tx: Prisma.TransactionClient,
    projetoId: string,
    bloqueadorId: string,
    bloqueadoId: string
  ): Promise<void> {
    const dependencias = await tx.projetoItemDependencia.findMany({
      where: {
        projetoId,
        arquivadoEm: null
      },
      select: {
        bloqueadorId: true,
        bloqueadoId: true
      }
    });
    assertProjetoDependenciaSemCiclo(
      dependencias,
      bloqueadorId,
      bloqueadoId
    );
  }
}
