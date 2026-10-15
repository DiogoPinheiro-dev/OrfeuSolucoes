import { Injectable } from '@nestjs/common';
import { retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
import {
  CONFIGURADOR_PRODUTO,
  DOCUMENTACAO_PRODUTO,
  obterFuncionalidadeProduto
} from '../instalacao/manifesto/catalogo-produto';
import { PrismaService } from '../../prisma/prisma.service';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeAgrupamentoService } from './funcionalidade-agrupamento.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { SolucaoChamadosBootstrapService } from './solucao-chamados-bootstrap.service';
import { FuncionalidadeRecord } from './types/solucao-record.types';
import { SolucaoProjetosBootstrapService } from './solucao-projetos-bootstrap.service';

@Injectable()
export class SolucaoBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService,
    private readonly solucaoAcessoService: SolucaoAcessoService,
    private readonly solucaoChamadosBootstrap: SolucaoChamadosBootstrapService,
    private readonly solucaoProjetosBootstrap: SolucaoProjetosBootstrapService,
    private readonly agrupamentos: FuncionalidadeAgrupamentoService
  ) {}

  async ensureDefaultChamadoConfiguracoesForEmpresa(empresaId: number, force = false): Promise<void> {
    return this.solucaoChamadosBootstrap.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId, force);
  }

  async ensureDefaultConfiguradorFeatures(): Promise<void> {
    await retryBootstrapAfterUniqueConflict(() => this.ensureDefaultConfiguradorFeaturesOnce());
  }

  private async ensureDefaultConfiguradorFeaturesOnce(): Promise<void> {
    const configurador = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: CONFIGURADOR_PRODUTO.slug },
      select: { id: true }
    })) as { id: number } | null;

    if (!configurador) {
      return;
    }

    await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
      where: { id: configurador.id },
      data: {
        nome: CONFIGURADOR_PRODUTO.nome,
        descricao: CONFIGURADOR_PRODUTO.descricao,
        eyebrow: CONFIGURADOR_PRODUTO.eyebrow,
        ativo: CONFIGURADOR_PRODUTO.ativo,
        exibirNoHub: CONFIGURADOR_PRODUTO.exibirNoHub,
        somenteAdminSistema: CONFIGURADOR_PRODUTO.somenteAdminSistema,
        padraoSistema: true
      }
    });

    await this.mergeDuplicateConfiguradorFeature(
      configurador.id,
      'cadastro-de-soluções',
      'cadastro-de-solucoes'
    );

    const defaultFeatures = [obterFuncionalidadeProduto(CONFIGURADOR_PRODUTO, 'cadastro-de-solucoes')];

    for (const feature of defaultFeatures) {
      const existing = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
        where: {
          solucaoId_slug: {
            solucaoId: configurador.id,
            slug: feature.slug
          }
        }
      })) as FuncionalidadeRecord | null;
      const funcionalidade = existing
        ? (await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
            where: { id: existing.id },
            data: {
              titulo: feature.titulo,
              label: feature.label,
              descricao: feature.descricao,
              ativo: feature.ativo,
              registryKey: feature.registryKey,
              somenteAdminSistema: feature.somenteAdminSistema,
              padraoSistema: true
            }
          })) as FuncionalidadeRecord
        : (await (this.prisma as never as { funcionalidade: { create: Function } }).funcionalidade.create({
            data: {
              solucaoId: configurador.id,
              slug: feature.slug,
              titulo: feature.titulo,
              label: feature.label,
              descricao: feature.descricao,
              ordem: feature.ordem,
              ativo: feature.ativo,
              registryKey: feature.registryKey,
              somenteAdminSistema: feature.somenteAdminSistema,
              padraoSistema: true
            }
          })) as FuncionalidadeRecord;

      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(funcionalidade.id, feature.acoes, { preserveAdditionalActions: true });

      if (!existing) {
        await this.solucaoAcessoService.syncNewFuncionalidadeAccess(funcionalidade);
      }
    }

    for (const agrupamento of CONFIGURADOR_PRODUTO.agrupamentos) {
      await this.agrupamentos.ensureAgrupamentoPadrao(configurador.id, agrupamento);
    }
  }

  async ensureDocumentationSolution(): Promise<void> {
    await retryBootstrapAfterUniqueConflict(() => this.ensureDocumentationSolutionOnce());
  }

  private async ensureDocumentationSolutionOnce(): Promise<void> {
    await (this.prisma as never as { solucao: { upsert: Function } }).solucao.upsert({
      where: { slug: DOCUMENTACAO_PRODUTO.slug },
      create: {
        slug: DOCUMENTACAO_PRODUTO.slug,
        nome: DOCUMENTACAO_PRODUTO.nome,
        descricao: DOCUMENTACAO_PRODUTO.descricao,
        eyebrow: DOCUMENTACAO_PRODUTO.eyebrow,
        ordem: DOCUMENTACAO_PRODUTO.ordem,
        ativo: DOCUMENTACAO_PRODUTO.ativo,
        exibirNoHub: DOCUMENTACAO_PRODUTO.exibirNoHub,
        somenteAdminSistema: DOCUMENTACAO_PRODUTO.somenteAdminSistema,
        padraoSistema: true
      },
      update: {
        nome: DOCUMENTACAO_PRODUTO.nome,
        descricao: DOCUMENTACAO_PRODUTO.descricao,
        eyebrow: DOCUMENTACAO_PRODUTO.eyebrow,
        ativo: DOCUMENTACAO_PRODUTO.ativo,
        exibirNoHub: DOCUMENTACAO_PRODUTO.exibirNoHub,
        somenteAdminSistema: DOCUMENTACAO_PRODUTO.somenteAdminSistema,
        padraoSistema: true
      }
    });
  }

  async ensureControleChamadosSolution(): Promise<void> {
    return this.solucaoChamadosBootstrap.ensureControleChamadosSolution();
  }

  async ensureProjetosSolution(): Promise<void> {
    return this.solucaoProjetosBootstrap.ensureProjetosSolution();
  }

  async mergeDuplicateConfiguradorFeature(solucaoId: number, duplicateSlug: string, targetSlug: string): Promise<void> {
    const duplicate = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
      where: {
        solucaoId_slug: {
          solucaoId,
          slug: duplicateSlug
        }
      }
    })) as FuncionalidadeRecord | null;

    if (!duplicate) {
      return;
    }

    const target = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
      where: {
        solucaoId_slug: {
          solucaoId,
          slug: targetSlug
        }
      }
    })) as FuncionalidadeRecord | null;

    if (!target) {
      await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
        where: { id: duplicate.id },
        data: { slug: targetSlug }
      });
      return;
    }

    await (this.prisma as never as { funcionalidade: { delete: Function } }).funcionalidade.delete({
      where: { id: duplicate.id }
    });
  }

}
