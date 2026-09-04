import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mergeCatalogoField } from './policies/catalogo-lifecycle.policy';

type EntityKind = 'SOLUCAO' | 'FUNCIONALIDADE';
type Snapshot = Record<string, unknown>;

@Injectable()
export class CatalogoBootstrapReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  reconcileSolution(solutionId: number, effective: Snapshot, baseline: Snapshot): Promise<void> {
    return this.reconcile('SOLUCAO', solutionId, effective, baseline);
  }

  reconcileFeature(featureId: number, effective: Snapshot, baseline: Snapshot): Promise<void> {
    return this.reconcile('FUNCIONALIDADE', featureId, effective, baseline);
  }

  private async reconcile(kind: EntityKind, entityId: number, effective: Snapshot, newBaseline: Snapshot): Promise<void> {
    await this.prisma.$transaction(async (db) => {
      const relation = kind === 'SOLUCAO' ? { solucaoId: entityId } : { funcionalidadeId: entityId };
      const published = await db.catalogoVersao.findFirst({ where: { ...relation, estado: 'PUBLICADA' } });
      const serializedBaseline = JSON.stringify(newBaseline);

      if (!published) {
        const version = await db.catalogoVersao.create({ data: { ...relation, numero: 1, estado: 'PUBLICADA', origem: 'PRODUTO', snapshot: JSON.stringify(effective), baselineSnapshot: serializedBaseline, publicadoEm: new Date() } });
        await db.catalogoAuditoria.create({ data: { versaoId: version.id, entidade: kind, entidadeId: entityId, evento: 'BOOTSTRAP_REGISTRADO', depois: version.snapshot } });
        return;
      }

      const previousBaseline = this.parse(published.baselineSnapshot ?? published.snapshot);
      if (this.equal(previousBaseline, newBaseline)) return;

      const currentDraft = await db.catalogoVersao.findFirst({ where: { ...relation, estado: 'RASCUNHO' } });
      const current = currentDraft ? this.parse(currentDraft.snapshot) : effective;
      const merged: Snapshot = { ...current };
      const conflicts: Array<{ field: string; previous: unknown; customized: unknown; next: unknown }> = [];

      for (const [field, next] of Object.entries(newBaseline)) {
        const result = mergeCatalogoField(previousBaseline[field], current[field], next);
        merged[field] = result.value;
        if (result.conflict) conflicts.push({ field, previous: previousBaseline[field], customized: current[field], next });
      }

      const latest = await db.catalogoVersao.findFirst({ where: relation, orderBy: { numero: 'desc' } });
      const draft = currentDraft
        ? await db.catalogoVersao.update({ where: { id: currentDraft.id }, data: { snapshot: JSON.stringify(merged), baselineSnapshot: serializedBaseline, versaoDefinicao: { increment: 1 }, revisao: { increment: 1 } } })
        : await db.catalogoVersao.create({ data: { ...relation, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'PRODUTO', versaoDefinicao: published.versaoDefinicao + 1, snapshot: JSON.stringify(merged), baselineSnapshot: serializedBaseline, motivo: 'Atualizacao da definicao do produto.' } });

      await db.catalogoConflito.deleteMany({ where: { versaoId: draft.id, estado: 'PENDENTE' } });
      for (const conflict of conflicts) {
        await db.catalogoConflito.create({ data: { versaoId: draft.id, campo: conflict.field, baselineAnterior: this.value(conflict.previous), valorCustomizado: this.value(conflict.customized), baselineNovo: this.value(conflict.next) } });
      }
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: kind, entidadeId: entityId, evento: 'BOOTSTRAP_RECONCILIADO', antes: published.baselineSnapshot, depois: draft.snapshot, motivo: conflicts.length ? 'Atualizacao com conflitos pendentes.' : 'Atualizacao da definicao do produto.' } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private parse(value: string): Snapshot { return JSON.parse(value) as Snapshot; }
  private equal(left: Snapshot, right: Snapshot): boolean { return JSON.stringify(left) === JSON.stringify(right); }
  private value(value: unknown): string | null { return value === undefined || value === null ? null : JSON.stringify(value); }
}
