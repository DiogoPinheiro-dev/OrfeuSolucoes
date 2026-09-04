import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';

type SincronizarEquipeInput = {
  empresaId: number;
  equipeId: string;
  equipeAtiva: boolean;
  recursoIds: string[];
  usuario: JwtPayload;
};

@Injectable()
export class ProjetoEquipeVinculoService {
  constructor(private readonly auditoria: ProjetoAuditoriaService) {}

  async sincronizar(tx: Prisma.TransactionClient, input: SincronizarEquipeInput): Promise<void> {
    const projetoEquipes = input.equipeAtiva
      ? await tx.projetoEquipe.findMany({
          where: { empresaId: input.empresaId, equipeId: input.equipeId, ativo: true },
          select: { id: true, projetoId: true }
        })
      : [];
    const origensAtuais = await tx.projetoRecursoEquipe.findMany({
      where: { empresaId: input.empresaId, projetoEquipe: { equipeId: input.equipeId } },
      include: { projetoRecurso: true, projetoEquipe: { select: { projetoId: true } } }
    });
    const desejados = new Set<string>();

    for (const projetoEquipe of projetoEquipes) {
      for (const recursoId of input.recursoIds) {
        const chave = this.chave(projetoEquipe.id, recursoId);
        desejados.add(chave);
        if (origensAtuais.some((origem) => this.chave(origem.projetoEquipeId, origem.projetoRecurso.recursoId) === chave)) continue;

        let projetoRecurso = await tx.projetoRecurso.findUnique({
          where: { projetoId_recursoId: { projetoId: projetoEquipe.projetoId, recursoId } }
        });
        if (!projetoRecurso) {
          projetoRecurso = await tx.projetoRecurso.create({
            data: { empresaId: input.empresaId, projetoId: projetoEquipe.projetoId, recursoId, ativo: true, vinculoDireto: false }
          });
        } else if (!projetoRecurso.ativo) {
          projetoRecurso = await tx.projetoRecurso.update({
            where: { id: projetoRecurso.id },
            data: { ativo: true, versao: { increment: 1 } }
          });
        }
        await tx.projetoRecursoEquipe.create({
          data: { empresaId: input.empresaId, projetoRecursoId: projetoRecurso.id, projetoEquipeId: projetoEquipe.id }
        });
        await this.incluirParticipacao(tx, projetoEquipe.projetoId, recursoId);
        await this.auditar(tx, input, projetoEquipe.projetoId, projetoRecurso.id, recursoId, 'ALOCADO_POR_EQUIPE');
      }
    }

    for (const origem of origensAtuais) {
      const chave = this.chave(origem.projetoEquipeId, origem.projetoRecurso.recursoId);
      if (desejados.has(chave)) continue;
      await tx.projetoRecursoEquipe.delete({ where: { id: origem.id } });
      const outrasOrigens = await tx.projetoRecursoEquipe.count({ where: { projetoRecursoId: origem.projetoRecursoId } });
      if (!origem.projetoRecurso.vinculoDireto && outrasOrigens === 0 && origem.projetoRecurso.ativo) {
        await tx.projetoRecurso.update({
          where: { id: origem.projetoRecursoId },
          data: { ativo: false, versao: { increment: 1 } }
        });
        await this.removerParticipacaoAutomatica(tx, origem.projetoEquipe.projetoId, origem.projetoRecurso.recursoId);
      }
      await this.auditar(tx, input, origem.projetoEquipe.projetoId, origem.projetoRecursoId, origem.projetoRecurso.recursoId, 'DESALOCADO_DA_EQUIPE');
    }
  }

  private chave(projetoEquipeId: string, recursoId: string): string {
    return `${projetoEquipeId}:${recursoId}`;
  }

  private async incluirParticipacao(tx: Prisma.TransactionClient, projetoId: string, recursoId: string): Promise<void> {
    const [projeto, recurso] = await Promise.all([
      tx.projeto.findUnique({ where: { id: projetoId }, select: { responsavelId: true } }),
      tx.recurso.findUnique({ where: { id: recursoId }, select: { usuarioId: true } })
    ]);
    if (!projeto || !recurso || projeto.responsavelId === recurso.usuarioId) return;
    const existente = await tx.projetoMembro.findUnique({
      where: { projetoId_usuarioId: { projetoId, usuarioId: recurso.usuarioId } }
    });
    if (!existente) {
      await tx.projetoMembro.create({ data: { projetoId, usuarioId: recurso.usuarioId, papel: 'MEMBRO', origem: 'RECURSO' } });
    }
  }

  private async removerParticipacaoAutomatica(tx: Prisma.TransactionClient, projetoId: string, recursoId: string): Promise<void> {
    const recurso = await tx.recurso.findUnique({ where: { id: recursoId }, select: { usuarioId: true } });
    if (!recurso) return;
    await tx.projetoMembro.deleteMany({ where: { projetoId, usuarioId: recurso.usuarioId, origem: 'RECURSO' } });
  }

  private auditar(
    tx: Prisma.TransactionClient,
    input: SincronizarEquipeInput,
    projetoId: string,
    projetoRecursoId: string,
    recursoId: string,
    evento: string
  ) {
    return this.auditoria.registrar(tx, {
      empresaId: input.empresaId,
      projetoId,
      usuarioId: input.usuario.sub,
      entidade: 'RECURSO_EQUIPE',
      entidadeId: projetoRecursoId,
      evento,
      dados: { equipeId: input.equipeId, recursoId }
    });
  }
}
