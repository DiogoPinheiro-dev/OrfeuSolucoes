import { Injectable } from '@nestjs/common';
import { retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
import { PROJETOS_PRODUTO } from '../instalacao/manifesto/catalogo-produto';
import { PrismaService } from '../../prisma/prisma.service';
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
      where: { slug: PROJETOS_PRODUTO.slug },
    })) as SolucaoRecord | null;

    const solutionBaseline = {
      slug: PROJETOS_PRODUTO.slug,
      nome: PROJETOS_PRODUTO.nome,
      descricao: PROJETOS_PRODUTO.descricao,
      eyebrow: PROJETOS_PRODUTO.eyebrow,
      ordem: PROJETOS_PRODUTO.ordem,
      ativo: PROJETOS_PRODUTO.ativo,
      exibirNoHub: PROJETOS_PRODUTO.exibirNoHub,
      somenteAdminSistema: PROJETOS_PRODUTO.somenteAdminSistema
    };

    const solucao = existingSolucao
      ? existingSolucao
      : (await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
          data: { ...solutionBaseline, padraoSistema: true }
        })) as { id: number };

    await this.reconciliation.reconcileSolution(solucao.id, existingSolucao ? { ...solutionBaseline, nome: existingSolucao.nome, descricao: existingSolucao.descricao, eyebrow: existingSolucao.eyebrow, ordem: existingSolucao.ordem, ativo: existingSolucao.ativo, exibirNoHub: existingSolucao.exibirNoHub, somenteAdminSistema: existingSolucao.somenteAdminSistema } : solutionBaseline, solutionBaseline);

    const features = PROJETOS_PRODUTO.funcionalidades;

    for (const feature of features) {
      const existing = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
        where: {
          solucaoId_slug: {
            solucaoId: solucao.id,
            slug: feature.slug
          }
        }
      })) as FuncionalidadeRecord | null;
      const featureBaseline = { solucaoId: solucao.id, slug: feature.slug, titulo: feature.titulo, label: feature.label, descricao: feature.descricao, ordem: feature.ordem, ativo: feature.ativo, registryKey: feature.registryKey, providerKey: feature.providerKey, providerVersion: feature.providerVersion, somenteAdminSistema: feature.somenteAdminSistema };
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
        await this.grantInitialAccess(solucao.id, funcionalidade, feature.acessoInicial, feature.copiarAcessoDe);
      }
    }

    for (const agrupamento of PROJETOS_PRODUTO.agrupamentos) {
      await this.agrupamentos.ensureAgrupamentoPadrao(solucao.id, agrupamento);
    }
  }

  /**
   * Uma funcionalidade nova derivada de outra recebe exatamente o acesso da origem, sem ampliar o acesso de nenhum grupo.
   * As demais seguem o acesso padrão da solução.
   */
  private async grantInitialAccess(
    solucaoId: number,
    funcionalidade: FuncionalidadeRecord,
    acessoInicial: 'PADRAO_DA_SOLUCAO' | 'SOMENTE_ADMINISTRADORES' = 'PADRAO_DA_SOLUCAO',
    origemSlug?: string
  ): Promise<void> {
    if (acessoInicial === 'SOMENTE_ADMINISTRADORES') {
      await this.solucaoAcessoService.syncNewFuncionalidadeCompanyAccess(funcionalidade);
      return;
    }

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
