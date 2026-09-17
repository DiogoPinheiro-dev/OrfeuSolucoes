import { Injectable } from '@nestjs/common';
import { retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJETOS_AGRUPAMENTOS_PADRAO } from './constants/agrupamento-definitions';
import { PROJETO_FEATURE_DEFINITIONS } from './constants/projeto-feature-definitions';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeAgrupamentoService } from './funcionalidade-agrupamento.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { FuncionalidadeRecord, SolucaoRecord } from './types/solucao-record.types';
import { CatalogoBootstrapReconciliationService } from './catalogo-bootstrap-reconciliation.service';

@Injectable()
export class SolucaoProjetosBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService,
    private readonly solucaoAcessoService: SolucaoAcessoService,
    private readonly reconciliation: CatalogoBootstrapReconciliationService,
    private readonly agrupamentos: FuncionalidadeAgrupamentoService
  ) {}

  async ensureProjetosSolution(): Promise<void> {
    await retryBootstrapAfterUniqueConflict(() => this.ensureProjetosSolutionOnce());
  }

  private async ensureProjetosSolutionOnce(): Promise<void> {
    const existingSolucao = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: 'projetos' },
    })) as SolucaoRecord | null;

    const solutionBaseline = { slug: 'projetos', nome: 'Gerenciador de Projetos', descricao: 'Espaço para organizar projetos, backlog, entregas, marcos e comunicação entre as equipes.', eyebrow: 'Operação', ordem: 10, ativo: true, exibirNoHub: true, somenteAdminSistema: false };

    const solucao = existingSolucao
      ? existingSolucao
      : (await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
          data: { ...solutionBaseline, padraoSistema: true }
        })) as { id: number };

    await this.reconciliation.reconcileSolution(solucao.id, existingSolucao ? { ...solutionBaseline, nome: existingSolucao.nome, descricao: existingSolucao.descricao, eyebrow: existingSolucao.eyebrow, ordem: existingSolucao.ordem, ativo: existingSolucao.ativo, exibirNoHub: existingSolucao.exibirNoHub, somenteAdminSistema: existingSolucao.somenteAdminSistema } : solutionBaseline, solutionBaseline);

    const features = PROJETO_FEATURE_DEFINITIONS;

    for (const feature of features) {
      const existing = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
        where: {
          solucaoId_slug: {
            solucaoId: solucao.id,
            slug: feature.slug
          }
        }
      })) as FuncionalidadeRecord | null;
      const featureBaseline = { solucaoId: solucao.id, slug: feature.slug, titulo: feature.titulo, label: feature.label, descricao: feature.descricao, ordem: feature.ordem, ativo: feature.ativo, registryKey: feature.registryKey, providerKey: feature.registryKey, providerVersion: 1, somenteAdminSistema: false };
      const funcionalidade = existing
        ? existing
        : (await (this.prisma as never as { funcionalidade: { create: Function } }).funcionalidade.create({
            data: {
              ...featureBaseline,
              padraoSistema: true
            }
          })) as FuncionalidadeRecord;

      const effective = existing ? { solucaoId: existing.solucaoId, slug: existing.slug, titulo: existing.titulo, label: existing.label ?? null, descricao: existing.descricao ?? null, ordem: existing.ordem, ativo: existing.ativo, registryKey: existing.registryKey ?? null, providerKey: existing.providerKey ?? existing.registryKey ?? null, providerVersion: existing.providerVersion ?? 1, somenteAdminSistema: existing.somenteAdminSistema } : featureBaseline;
      await this.reconciliation.reconcileFeature(funcionalidade.id, effective, featureBaseline);

      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(funcionalidade.id, feature.acoes, { preserveAdditionalActions: true });

      if (!existing) {
        await this.grantInitialAccess(solucao.id, funcionalidade, feature.copiarAcessoDe);
      }
    }

    for (const agrupamento of PROJETOS_AGRUPAMENTOS_PADRAO) {
      await this.agrupamentos.ensureAgrupamentoPadrao(solucao.id, agrupamento);
    }
  }

  /**
   * Uma funcionalidade nova derivada de outra recebe exatamente o acesso da origem, sem ampliar o acesso de nenhum grupo.
   * As demais seguem o acesso padrão da solução.
   */
  private async grantInitialAccess(solucaoId: number, funcionalidade: FuncionalidadeRecord, origemSlug?: string): Promise<void> {
    if (!origemSlug) {
      await this.solucaoAcessoService.syncNewFuncionalidadeAccess(funcionalidade);
      return;
    }

    const origem = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
      where: { solucaoId_slug: { solucaoId, slug: origemSlug } },
      select: { id: true }
    })) as { id: number } | null;
    if (origem) {
      await this.solucaoAcessoService.copyFuncionalidadeAccess(origem.id, funcionalidade);
    }
  }
}
