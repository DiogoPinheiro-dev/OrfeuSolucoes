import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogoValidationService } from './catalogo-validation.service';
import { assertCatalogoRevision, publicationBlocked } from './policies/catalogo-lifecycle.policy';
import { UpdateCatalogoFuncionalidadeDraftInput } from './dto/update-catalogo-funcionalidade-draft.input';
import { UpdateCatalogoSolucaoDraftInput } from './dto/update-catalogo-solucao-draft.input';
import { UpdateCatalogoAcaoDraftInput } from './dto/update-catalogo-acao-draft.input';
import { CatalogoActionConsumerRegistry } from './catalogo-action-consumer.registry';
import { CatalogoActionSnapshot } from './types/catalogo-lifecycle.types';

type FeatureSnapshot = {
  solucaoId: number; slug: string; titulo: string; label: string | null; descricao: string | null;
  ordem: number; ativo: boolean; registryKey: string | null; providerKey: string | null;
  providerVersion: number | null; somenteAdminSistema: boolean;
};

type SolutionSnapshot = {
  slug: string; nome: string; descricao: string | null; eyebrow: string | null; ordem: number;
  ativo: boolean; exibirNoHub: boolean; somenteAdminSistema: boolean;
};

@Injectable()
export class CatalogoLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: CatalogoValidationService,
    private readonly actionConsumers: CatalogoActionConsumerRegistry = new CatalogoActionConsumerRegistry()
  ) {}

  async createSolutionDraft(solutionId: number, authorId: string, reason?: string) {
    return this.prisma.$transaction(async (db) => {
      const solution = await db.solucao.findUnique({ where: { id: solutionId } });
      if (!solution) throw new NotFoundException('Solucao nao encontrada.');
      if (await db.catalogoVersao.findFirst({ where: { solucaoId: solutionId, estado: 'RASCUNHO' } })) throw new ConflictException('A solucao ja possui um rascunho em edicao.');
      const latest = await db.catalogoVersao.findFirst({ where: { solucaoId: solutionId }, orderBy: { numero: 'desc' } });
      const draft = await db.catalogoVersao.create({ data: { solucaoId: solutionId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'CUSTOMIZACAO', versaoDefinicao: solution.versaoDefinicao, snapshot: JSON.stringify(this.solutionSnapshot(solution)), baselineSnapshot: latest?.baselineSnapshot ?? null, motivo: reason?.trim() || null, criadoPorId: authorId } });
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: 'SOLUCAO', entidadeId: solutionId, evento: 'RASCUNHO_CRIADO', depois: draft.snapshot, motivo: draft.motivo, autorId: authorId } });
      return draft;
    });
  }

  async updateSolutionDraft(input: UpdateCatalogoSolucaoDraftInput, authorId: string) {
    return this.prisma.$transaction(async (db) => {
      const draft = await db.catalogoVersao.findUnique({ where: { id: input.versaoId } });
      if (!draft?.solucaoId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de solucao nao encontrado.');
      assertCatalogoRevision(input.revisaoEsperada, draft.revisao);
      const current = this.parseSolution(draft.snapshot);
      const next: SolutionSnapshot = { ...current,
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.eyebrow !== undefined ? { eyebrow: input.eyebrow?.trim() || null } : {}),
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}), ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.exibirNoHub !== undefined ? { exibirNoHub: input.exibirNoHub } : {}),
        ...(input.somenteAdminSistema !== undefined ? { somenteAdminSistema: input.somenteAdminSistema } : {}) };
      if (!next.nome) throw new BadRequestException('Informe o nome da solucao.');
      const changed = await db.catalogoVersao.updateMany({ where: { id: draft.id, estado: 'RASCUNHO', revisao: input.revisaoEsperada }, data: { snapshot: JSON.stringify(next), revisao: { increment: 1 }, motivo: input.motivo?.trim() || draft.motivo } });
      if (changed.count !== 1) throw new ConflictException('O rascunho foi alterado por outro usuario. Recarregue os dados antes de continuar.');
      const updated = await db.catalogoVersao.findUniqueOrThrow({ where: { id: draft.id } });
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: 'SOLUCAO', entidadeId: draft.solucaoId, evento: 'RASCUNHO_ALTERADO', antes: draft.snapshot, depois: updated.snapshot, motivo: updated.motivo, autorId: authorId } });
      return updated;
    });
  }

  async publishSolutionDraft(versionId: string, expectedRevision: number, authorId: string, reason?: string) {
    return this.prisma.$transaction(async (db) => {
      const draft = await db.catalogoVersao.findUnique({ where: { id: versionId }, include: { conflitos: { where: { estado: 'PENDENTE' }, select: { id: true } } } });
      if (!draft?.solucaoId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de solucao nao encontrado.');
      assertCatalogoRevision(expectedRevision, draft.revisao);
      if (draft.conflitos.length) throw new BadRequestException('Resolva os conflitos da solucao antes de publicar.');
      const snapshot = this.parseSolution(draft.snapshot);
      const previous = await db.catalogoVersao.findFirst({ where: { solucaoId: draft.solucaoId, estado: 'PUBLICADA' } });
      if (previous) await db.catalogoVersao.update({ where: { id: previous.id }, data: { estado: 'SUBSTITUIDA' } });
      const published = await db.catalogoVersao.update({ where: { id: draft.id }, data: { estado: 'PUBLICADA', publicadoPorId: authorId, publicadoEm: new Date(), motivo: reason?.trim() || draft.motivo } });
      await db.solucao.update({ where: { id: draft.solucaoId }, data: { ...snapshot, statusPublicacao: 'PUBLICADA', revisaoCatalogo: { increment: 1 }, publicadoEm: published.publicadoEm } });
      await db.catalogoAuditoria.create({ data: { versaoId: published.id, entidade: 'SOLUCAO', entidadeId: draft.solucaoId, evento: 'PUBLICADA', antes: previous?.snapshot ?? null, depois: published.snapshot, motivo: published.motivo, autorId: authorId } });
      return published;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async unpublishSolution(solutionId: number, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da despublicacao.');
    return this.prisma.$transaction(async (db) => {
      const current = await db.solucao.findUnique({ where: { id: solutionId } });
      if (!current) throw new NotFoundException('Solucao nao encontrada.');
      if (current.statusPublicacao !== 'PUBLICADA') throw new ConflictException('A solucao nao esta publicada.');
      const updated = await db.solucao.update({ where: { id: solutionId }, data: { statusPublicacao: 'DESPUBLICADA', revisaoCatalogo: { increment: 1 } } });
      await db.catalogoAuditoria.create({ data: { entidade: 'SOLUCAO', entidadeId: solutionId, evento: 'DESPUBLICADA', antes: JSON.stringify(this.solutionSnapshot(current)), depois: JSON.stringify(this.solutionSnapshot(updated)), motivo: reason.trim(), autorId: authorId } });
      return updated;
    });
  }

  async restoreSolutionVersion(sourceVersionId: string, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da restauracao.');
    return this.prisma.$transaction(async (db) => {
      const source = await db.catalogoVersao.findUnique({ where: { id: sourceVersionId } });
      if (!source?.solucaoId || source.estado === 'RASCUNHO' || source.estado === 'DESCARTADA') throw new NotFoundException('Versao publicada da solucao nao encontrada.');
      if (await db.catalogoVersao.findFirst({ where: { solucaoId: source.solucaoId, estado: 'RASCUNHO' } })) throw new ConflictException('Descarte ou publique o rascunho atual antes de restaurar outra versao.');
      const latest = await db.catalogoVersao.findFirst({ where: { solucaoId: source.solucaoId }, orderBy: { numero: 'desc' } });
      const restored = await db.catalogoVersao.create({ data: { solucaoId: source.solucaoId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'RESTAURACAO', versaoDefinicao: source.versaoDefinicao, snapshot: source.snapshot, baselineSnapshot: source.baselineSnapshot, motivo: reason.trim(), criadoPorId: authorId } });
      await db.catalogoAuditoria.create({ data: { versaoId: restored.id, entidade: 'SOLUCAO', entidadeId: source.solucaoId, evento: 'RESTAURACAO_CRIADA', antes: source.snapshot, depois: restored.snapshot, motivo: restored.motivo, autorId: authorId } });
      return restored;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async restoreSolutionBaseline(solutionId: number, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da restauracao.');
    const published = await this.prisma.catalogoVersao.findFirst({ where: { solucaoId: solutionId, estado: 'PUBLICADA' } });
    if (!published?.baselineSnapshot) throw new BadRequestException('A solucao nao possui uma definicao padrao restauravel.');
    const baselineSnapshot = published.baselineSnapshot;
    return this.prisma.$transaction(async (db) => {
      if (await db.catalogoVersao.findFirst({ where: { solucaoId: solutionId, estado: 'RASCUNHO' } })) throw new ConflictException('Descarte ou publique o rascunho atual antes de restaurar o padrao.');
      const latest = await db.catalogoVersao.findFirst({ where: { solucaoId: solutionId }, orderBy: { numero: 'desc' } });
      const restored = await db.catalogoVersao.create({ data: { solucaoId: solutionId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'RESTAURACAO', versaoDefinicao: published.versaoDefinicao, snapshot: baselineSnapshot, baselineSnapshot, motivo: reason.trim(), criadoPorId: authorId } });
      await db.catalogoAuditoria.create({ data: { versaoId: restored.id, entidade: 'SOLUCAO', entidadeId: solutionId, evento: 'PADRAO_RESTAURADO', antes: published.snapshot, depois: restored.snapshot, motivo: restored.motivo, autorId: authorId } });
      return restored;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createFeatureDraft(featureId: number, authorId: string, reason?: string) {
    return this.prisma.$transaction(async (db) => {
      const feature = await db.funcionalidade.findUnique({ where: { id: featureId } });
      if (!feature) throw new NotFoundException('Funcionalidade nao encontrada.');
      if (await db.catalogoVersao.findFirst({ where: { funcionalidadeId: featureId, estado: 'RASCUNHO' } })) {
        throw new ConflictException('A funcionalidade ja possui um rascunho em edicao.');
      }
      const latest = await db.catalogoVersao.findFirst({ where: { funcionalidadeId: featureId }, orderBy: { numero: 'desc' } });
      const draft = await db.catalogoVersao.create({ data: {
        funcionalidadeId: featureId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'CUSTOMIZACAO',
        versaoDefinicao: feature.versaoDefinicao, snapshot: JSON.stringify(this.snapshot(feature)),
        baselineSnapshot: latest?.baselineSnapshot ?? null, motivo: reason?.trim() || null, criadoPorId: authorId
      } });
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: 'FUNCIONALIDADE', entidadeId: featureId, evento: 'RASCUNHO_CRIADO', depois: draft.snapshot, motivo: draft.motivo, autorId: authorId } });
      return draft;
    });
  }

  findFeatureDraft(featureId: number) {
    return this.prisma.catalogoVersao.findFirst({
      where: { funcionalidadeId: featureId, estado: 'RASCUNHO' },
      orderBy: { numero: 'desc' }
    });
  }

  async validateFeatureDraft(versionId: string) {
    const draft = await this.prisma.catalogoVersao.findUnique({ where: { id: versionId }, include: { conflitos: { where: { estado: 'PENDENTE' }, select: { id: true } } } });
    if (!draft?.funcionalidadeId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de funcionalidade nao encontrado.');
    const feature = await this.prisma.funcionalidade.findUnique({ where: { id: draft.funcionalidadeId } });
    if (!feature) throw new NotFoundException('Funcionalidade nao encontrada.');
    const snapshot = this.parse(draft.snapshot);
    return this.validation.validateFuncionalidade({ chaveTecnica: feature.chaveTecnica, providerKey: snapshot.providerKey, providerVersion: snapshot.providerVersion, pendingConflicts: draft.conflitos.length });
  }

  async updateFeatureDraft(input: UpdateCatalogoFuncionalidadeDraftInput, authorId: string) {
    return this.prisma.$transaction(async (db) => {
      const draft = await db.catalogoVersao.findUnique({ where: { id: input.versaoId } });
      if (!draft?.funcionalidadeId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de funcionalidade nao encontrado.');
      assertCatalogoRevision(input.revisaoEsperada, draft.revisao);
      const current = this.parse(draft.snapshot);
      const next: FeatureSnapshot = {
        ...current,
        ...(input.titulo !== undefined ? { titulo: input.titulo.trim() } : {}),
        ...(input.label !== undefined ? { label: input.label?.trim() || null } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.providerKey !== undefined ? { providerKey: input.providerKey?.trim() || null } : {}),
        ...(input.providerVersion !== undefined ? { providerVersion: input.providerVersion } : {}),
        ...(input.somenteAdminSistema !== undefined ? { somenteAdminSistema: input.somenteAdminSistema } : {})
      };
      if (!next.titulo) throw new BadRequestException('Informe o titulo da funcionalidade.');
      const changed = await db.catalogoVersao.updateMany({ where: { id: draft.id, estado: 'RASCUNHO', revisao: input.revisaoEsperada }, data: { snapshot: JSON.stringify(next), revisao: { increment: 1 }, motivo: input.motivo?.trim() || draft.motivo } });
      if (changed.count !== 1) throw new ConflictException('O rascunho foi alterado por outro usuario. Recarregue os dados antes de continuar.');
      const updated = await db.catalogoVersao.findUniqueOrThrow({ where: { id: draft.id } });
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: 'FUNCIONALIDADE', entidadeId: draft.funcionalidadeId, evento: 'RASCUNHO_ALTERADO', antes: draft.snapshot, depois: updated.snapshot, motivo: updated.motivo, autorId: authorId } });
      return updated;
    });
  }

  async publishFeatureDraft(versionId: string, expectedRevision: number, authorId: string, reason?: string) {
    const issues = await this.validateFeatureDraft(versionId);
    if (publicationBlocked(issues)) throw new BadRequestException({ message: 'O rascunho possui erros que impedem a publicacao.', issues });
    return this.prisma.$transaction(async (db) => {
      const draft = await db.catalogoVersao.findUnique({ where: { id: versionId } });
      if (!draft?.funcionalidadeId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de funcionalidade nao encontrado.');
      assertCatalogoRevision(expectedRevision, draft.revisao);
      const previous = await db.catalogoVersao.findFirst({ where: { funcionalidadeId: draft.funcionalidadeId, estado: 'PUBLICADA' } });
      if (previous) await db.catalogoVersao.update({ where: { id: previous.id }, data: { estado: 'SUBSTITUIDA' } });
      const published = await db.catalogoVersao.update({ where: { id: draft.id }, data: { estado: 'PUBLICADA', publicadoPorId: authorId, publicadoEm: new Date(), motivo: reason?.trim() || draft.motivo } });
      await db.funcionalidade.update({ where: { id: draft.funcionalidadeId }, data: { ...this.parse(draft.snapshot), statusPublicacao: 'PUBLICADA', revisaoCatalogo: { increment: 1 }, publicadoEm: published.publicadoEm } });
      await db.catalogoAuditoria.create({ data: { versaoId: published.id, entidade: 'FUNCIONALIDADE', entidadeId: draft.funcionalidadeId, evento: 'PUBLICADA', antes: previous?.snapshot ?? null, depois: published.snapshot, motivo: published.motivo, autorId: authorId } });
      return published;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async unpublishFeature(featureId: number, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da despublicacao.');
    return this.prisma.$transaction(async (db) => {
      const current = await db.funcionalidade.findUnique({ where: { id: featureId } });
      if (!current) throw new NotFoundException('Funcionalidade nao encontrada.');
      if (current.statusPublicacao !== 'PUBLICADA') throw new ConflictException('A funcionalidade nao esta publicada.');
      const updated = await db.funcionalidade.update({ where: { id: featureId }, data: { statusPublicacao: 'DESPUBLICADA', revisaoCatalogo: { increment: 1 } } });
      await db.catalogoAuditoria.create({ data: { entidade: 'FUNCIONALIDADE', entidadeId: featureId, evento: 'DESPUBLICADA', antes: JSON.stringify(this.snapshot(current)), depois: JSON.stringify(this.snapshot(updated)), motivo: reason.trim(), autorId: authorId } });
      return updated;
    });
  }

  async restoreFeatureVersion(sourceVersionId: string, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da restauracao.');
    return this.prisma.$transaction(async (db) => {
      const source = await db.catalogoVersao.findUnique({ where: { id: sourceVersionId } });
      if (!source?.funcionalidadeId || source.estado === 'RASCUNHO' || source.estado === 'DESCARTADA') {
        throw new NotFoundException('Versao publicada da funcionalidade nao encontrada.');
      }
      if (await db.catalogoVersao.findFirst({ where: { funcionalidadeId: source.funcionalidadeId, estado: 'RASCUNHO' } })) {
        throw new ConflictException('Descarte ou publique o rascunho atual antes de restaurar outra versao.');
      }
      const latest = await db.catalogoVersao.findFirst({ where: { funcionalidadeId: source.funcionalidadeId }, orderBy: { numero: 'desc' } });
      const restored = await db.catalogoVersao.create({ data: {
        funcionalidadeId: source.funcionalidadeId,
        numero: (latest?.numero ?? 0) + 1,
        estado: 'RASCUNHO', origem: 'RESTAURACAO', revisao: 1,
        versaoDefinicao: source.versaoDefinicao, snapshot: source.snapshot,
        baselineSnapshot: source.baselineSnapshot, motivo: reason.trim(), criadoPorId: authorId
      } });
      await db.catalogoAuditoria.create({ data: { versaoId: restored.id, entidade: 'FUNCIONALIDADE', entidadeId: source.funcionalidadeId, evento: 'RESTAURACAO_CRIADA', antes: source.snapshot, depois: restored.snapshot, motivo: restored.motivo, autorId: authorId } });
      return restored;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async restoreFeatureBaseline(featureId: number, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da restauracao.');
    const published = await this.prisma.catalogoVersao.findFirst({ where: { funcionalidadeId: featureId, estado: 'PUBLICADA' } });
    if (!published?.baselineSnapshot) throw new BadRequestException('A funcionalidade nao possui uma definicao padrao restauravel.');
    const baselineSnapshot = published.baselineSnapshot;
    return this.prisma.$transaction(async (db) => {
      if (await db.catalogoVersao.findFirst({ where: { funcionalidadeId: featureId, estado: 'RASCUNHO' } })) throw new ConflictException('Descarte ou publique o rascunho atual antes de restaurar o padrao.');
      const latest = await db.catalogoVersao.findFirst({ where: { funcionalidadeId: featureId }, orderBy: { numero: 'desc' } });
      const restored = await db.catalogoVersao.create({ data: { funcionalidadeId: featureId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'RESTAURACAO', versaoDefinicao: published.versaoDefinicao, snapshot: baselineSnapshot, baselineSnapshot, motivo: reason.trim(), criadoPorId: authorId } });
      await db.catalogoAuditoria.create({ data: { versaoId: restored.id, entidade: 'FUNCIONALIDADE', entidadeId: featureId, evento: 'PADRAO_RESTAURADO', antes: published.snapshot, depois: restored.snapshot, motivo: restored.motivo, autorId: authorId } });
      return restored;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createActionDraft(actionId: number, authorId: string, reason?: string) {
    return this.prisma.$transaction(async (db) => {
      const action = await db.funcionalidadeAcao.findUnique({ where: { id: actionId } });
      if (!action) throw new NotFoundException('Acao nao encontrada.');
      if (await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: actionId, estado: 'RASCUNHO' } })) {
        throw new ConflictException('A acao ja possui um rascunho em edicao.');
      }
      const latest = await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: actionId }, orderBy: { numero: 'desc' } });
      const draft = await db.catalogoVersao.create({ data: {
        funcionalidadeAcaoId: actionId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'CUSTOMIZACAO',
        versaoDefinicao: action.versaoDefinicao, snapshot: JSON.stringify(this.actionSnapshot(action)),
        baselineSnapshot: latest?.baselineSnapshot ?? null, motivo: reason?.trim() || null, criadoPorId: authorId
      } });
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: 'ACAO', entidadeId: actionId, evento: 'RASCUNHO_CRIADO', depois: draft.snapshot, motivo: draft.motivo, autorId: authorId } });
      return draft;
    });
  }

  findActionDraft(actionId: number) {
    return this.prisma.catalogoVersao.findFirst({
      where: { funcionalidadeAcaoId: actionId, estado: 'RASCUNHO' },
      orderBy: { numero: 'desc' }
    });
  }

  async updateActionDraft(input: UpdateCatalogoAcaoDraftInput, authorId: string) {
    return this.prisma.$transaction(async (db) => {
      const draft = await db.catalogoVersao.findUnique({ where: { id: input.versaoId } });
      if (!draft?.funcionalidadeAcaoId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de acao nao encontrado.');
      assertCatalogoRevision(input.revisaoEsperada, draft.revisao);
      const current = this.parseAction(draft.snapshot);
      const next: CatalogoActionSnapshot = { ...current,
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.configuracao !== undefined ? { configuracao: input.configuracao?.trim() || null } : {}),
        ...(input.consumerKey !== undefined ? { consumerKey: input.consumerKey?.trim() || null } : {}),
        ...(input.consumerVersion !== undefined ? { consumerVersion: input.consumerVersion } : {}) };
      if (!next.nome) throw new BadRequestException('Informe o nome da acao.');
      const changed = await db.catalogoVersao.updateMany({ where: { id: draft.id, estado: 'RASCUNHO', revisao: input.revisaoEsperada }, data: { snapshot: JSON.stringify(next), revisao: { increment: 1 }, motivo: input.motivo?.trim() || draft.motivo } });
      if (changed.count !== 1) throw new ConflictException('O rascunho foi alterado por outro usuario. Recarregue os dados antes de continuar.');
      const updated = await db.catalogoVersao.findUniqueOrThrow({ where: { id: draft.id } });
      await db.catalogoAuditoria.create({ data: { versaoId: draft.id, entidade: 'ACAO', entidadeId: draft.funcionalidadeAcaoId, evento: 'RASCUNHO_ALTERADO', antes: draft.snapshot, depois: updated.snapshot, motivo: updated.motivo, autorId: authorId } });
      return updated;
    });
  }

  async validateActionDraft(versionId: string) {
    const draft = await this.prisma.catalogoVersao.findUnique({ where: { id: versionId }, include: { conflitos: { where: { estado: 'PENDENTE' }, select: { id: true } } } });
    if (!draft?.funcionalidadeAcaoId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de acao nao encontrado.');
    const snapshot = this.parseAction(draft.snapshot);
    const issues = [];
    if (!snapshot.consumerKey) issues.push({ code: 'CONSUMER_REQUIRED', field: 'consumerKey', message: 'Associe um consumidor antes de publicar.', severity: 'ERROR' as const });
    else if (!this.actionConsumers.isCompatible(snapshot.consumerKey, snapshot.consumerVersion)) issues.push({ code: 'CONSUMER_INCOMPATIBLE', field: 'consumerKey', message: 'O consumidor informado nao existe ou possui versao incompativel.', severity: 'ERROR' as const });
    if (draft.conflitos.length) issues.push({ code: 'CONFLICTS_PENDING', message: 'Resolva os conflitos da definicao antes de publicar.', severity: 'ERROR' as const });
    return issues;
  }

  async publishActionDraft(versionId: string, expectedRevision: number, authorId: string, reason?: string) {
    const issues = await this.validateActionDraft(versionId);
    if (publicationBlocked(issues)) throw new BadRequestException({ message: 'O rascunho possui erros que impedem a publicacao.', issues });
    return this.prisma.$transaction(async (db) => {
      const draft = await db.catalogoVersao.findUnique({ where: { id: versionId } });
      if (!draft?.funcionalidadeAcaoId || draft.estado !== 'RASCUNHO') throw new NotFoundException('Rascunho de acao nao encontrado.');
      assertCatalogoRevision(expectedRevision, draft.revisao);
      const previous = await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: draft.funcionalidadeAcaoId, estado: 'PUBLICADA' } });
      if (previous) await db.catalogoVersao.update({ where: { id: previous.id }, data: { estado: 'SUBSTITUIDA' } });
      const published = await db.catalogoVersao.update({ where: { id: draft.id }, data: { estado: 'PUBLICADA', publicadoPorId: authorId, publicadoEm: new Date(), motivo: reason?.trim() || draft.motivo } });
      const snapshot = this.parseAction(draft.snapshot);
      await db.funcionalidadeAcao.update({ where: { id: draft.funcionalidadeAcaoId }, data: { ...snapshot, statusPublicacao: 'PUBLICADA', revisaoCatalogo: { increment: 1 }, publicadoEm: published.publicadoEm } });
      const groups = await db.grupoFuncionalidade.findMany({ where: { funcionalidadeId: snapshot.funcionalidadeId }, select: { grupoId: true } });
      for (const group of groups) {
        await db.grupoFuncionalidadeAcao.upsert({
          where: { grupoId_funcionalidadeAcaoId: { grupoId: group.grupoId, funcionalidadeAcaoId: draft.funcionalidadeAcaoId } },
          update: {},
          create: { grupoId: group.grupoId, funcionalidadeAcaoId: draft.funcionalidadeAcaoId, permitido: false }
        });
      }
      await db.catalogoAuditoria.create({ data: { versaoId: published.id, entidade: 'ACAO', entidadeId: draft.funcionalidadeAcaoId, evento: 'PUBLICADA', antes: previous?.snapshot ?? null, depois: published.snapshot, motivo: published.motivo, autorId: authorId } });
      return published;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async unpublishAction(actionId: number, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da despublicacao.');
    return this.prisma.$transaction(async (db) => {
      const current = await db.funcionalidadeAcao.findUnique({ where: { id: actionId } });
      if (!current) throw new NotFoundException('Acao nao encontrada.');
      if (current.statusPublicacao !== 'PUBLICADA') throw new ConflictException('A acao nao esta publicada.');
      const updated = await db.funcionalidadeAcao.update({ where: { id: actionId }, data: { statusPublicacao: 'DESPUBLICADA', revisaoCatalogo: { increment: 1 } } });
      await db.catalogoAuditoria.create({ data: { entidade: 'ACAO', entidadeId: actionId, evento: 'DESPUBLICADA', antes: JSON.stringify(this.actionSnapshot(current)), depois: JSON.stringify(this.actionSnapshot(updated)), motivo: reason.trim(), autorId: authorId } });
      return updated;
    });
  }

  async restoreActionVersion(sourceVersionId: string, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da restauracao.');
    return this.prisma.$transaction(async (db) => {
      const source = await db.catalogoVersao.findUnique({ where: { id: sourceVersionId } });
      if (!source?.funcionalidadeAcaoId || source.estado === 'RASCUNHO' || source.estado === 'DESCARTADA') throw new NotFoundException('Versao publicada da acao nao encontrada.');
      if (await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: source.funcionalidadeAcaoId, estado: 'RASCUNHO' } })) throw new ConflictException('Descarte ou publique o rascunho atual antes de restaurar outra versao.');
      const latest = await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: source.funcionalidadeAcaoId }, orderBy: { numero: 'desc' } });
      const restored = await db.catalogoVersao.create({ data: { funcionalidadeAcaoId: source.funcionalidadeAcaoId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'RESTAURACAO', versaoDefinicao: source.versaoDefinicao, snapshot: source.snapshot, baselineSnapshot: source.baselineSnapshot, motivo: reason.trim(), criadoPorId: authorId } });
      await db.catalogoAuditoria.create({ data: { versaoId: restored.id, entidade: 'ACAO', entidadeId: source.funcionalidadeAcaoId, evento: 'RESTAURACAO_CRIADA', antes: source.snapshot, depois: restored.snapshot, motivo: restored.motivo, autorId: authorId } });
      return restored;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async restoreActionBaseline(actionId: number, authorId: string, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Informe o motivo da restauracao.');
    const published = await this.prisma.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: actionId, estado: 'PUBLICADA' } });
    if (!published?.baselineSnapshot) throw new BadRequestException('A acao nao possui uma definicao padrao restauravel.');
    return this.prisma.$transaction(async (db) => {
      if (await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: actionId, estado: 'RASCUNHO' } })) throw new ConflictException('Descarte ou publique o rascunho atual antes de restaurar o padrao.');
      const latest = await db.catalogoVersao.findFirst({ where: { funcionalidadeAcaoId: actionId }, orderBy: { numero: 'desc' } });
      const restored = await db.catalogoVersao.create({ data: { funcionalidadeAcaoId: actionId, numero: (latest?.numero ?? 0) + 1, estado: 'RASCUNHO', origem: 'RESTAURACAO', versaoDefinicao: published.versaoDefinicao, snapshot: published.baselineSnapshot!, baselineSnapshot: published.baselineSnapshot, motivo: reason.trim(), criadoPorId: authorId } });
      await db.catalogoAuditoria.create({ data: { versaoId: restored.id, entidade: 'ACAO', entidadeId: actionId, evento: 'PADRAO_RESTAURADO', antes: published.snapshot, depois: restored.snapshot, motivo: restored.motivo, autorId: authorId } });
      return restored;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private snapshot(feature: FeatureSnapshot): FeatureSnapshot {
    return { solucaoId: feature.solucaoId, slug: feature.slug, titulo: feature.titulo, label: feature.label, descricao: feature.descricao, ordem: feature.ordem, ativo: feature.ativo, registryKey: feature.registryKey, providerKey: feature.providerKey, providerVersion: feature.providerVersion, somenteAdminSistema: feature.somenteAdminSistema };
  }

  private solutionSnapshot(solution: SolutionSnapshot): SolutionSnapshot {
    return { slug: solution.slug, nome: solution.nome, descricao: solution.descricao, eyebrow: solution.eyebrow, ordem: solution.ordem, ativo: solution.ativo, exibirNoHub: solution.exibirNoHub, somenteAdminSistema: solution.somenteAdminSistema };
  }

  private parseSolution(value: string): SolutionSnapshot {
    try { return JSON.parse(value) as SolutionSnapshot; } catch { throw new BadRequestException('O rascunho possui um snapshot invalido.'); }
  }

  private parse(value: string): FeatureSnapshot {
    try { return JSON.parse(value) as FeatureSnapshot; } catch { throw new BadRequestException('O rascunho possui um snapshot invalido.'); }
  }

  private actionSnapshot(action: CatalogoActionSnapshot): CatalogoActionSnapshot {
    return { funcionalidadeId: action.funcionalidadeId, chave: action.chave, nome: action.nome, descricao: action.descricao, ordem: action.ordem, ativo: action.ativo, configuracao: action.configuracao, consumerKey: action.consumerKey, consumerVersion: action.consumerVersion };
  }

  private parseAction(value: string): CatalogoActionSnapshot {
    try { return JSON.parse(value) as CatalogoActionSnapshot; } catch { throw new BadRequestException('O rascunho possui um snapshot invalido.'); }
  }
}
