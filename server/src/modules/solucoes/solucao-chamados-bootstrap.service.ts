import { Injectable } from '@nestjs/common';
import { isPrismaUniqueConstraintViolation, retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
import { CONTROLE_CHAMADOS_PRODUTO } from '../instalacao/manifesto/catalogo-produto';
import { DADOS_INICIAIS_PRODUTO } from '../instalacao/manifesto/dados-iniciais';
import { PrismaService } from '../../prisma/prisma.service';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { FuncionalidadeAgrupamentoService } from './funcionalidade-agrupamento.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { FuncionalidadeRecord } from './types/solucao-record.types';

@Injectable()
export class SolucaoChamadosBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService,
    private readonly solucaoAcessoService: SolucaoAcessoService,
    private readonly agrupamentos: FuncionalidadeAgrupamentoService
  ) {}

  async ensureDefaultChamadoConfiguracoesForEmpresa(empresaId: number, force = false): Promise<void> {
    const acessoControleChamados = force
      ? { id: 0 }
      : await this.findControleChamadosCompanyAccess(empresaId);

    if (!acessoControleChamados) {
      return;
    }

    for (const tipo of DADOS_INICIAIS_PRODUTO.chamados.tipos) {
      await this.ensureDefaultConfiguracao(
        (this.prisma as never as { chamadoTipo: ChamadoConfiguracaoDelegate }).chamadoTipo,
        empresaId,
        tipo
      );
    }

    for (const prioridade of DADOS_INICIAIS_PRODUTO.chamados.prioridades) {
      await this.ensureDefaultConfiguracao(
        (this.prisma as never as { chamadoPrioridade: ChamadoConfiguracaoDelegate }).chamadoPrioridade,
        empresaId,
        prioridade
      );
    }
  }

  private async ensureDefaultConfiguracao(
    delegate: ChamadoConfiguracaoDelegate,
    empresaId: number,
    configuracao: DefaultChamadoConfiguracao
  ): Promise<void> {
    const existing = await delegate.findFirst({
      where: { empresaId, nome: configuracao.nome },
      select: { id: true }
    }) as { id: number } | null;

    if (existing) {
      return;
    }

    try {
      await delegate.create({
        data: {
          empresaId,
          nome: configuracao.nome,
          descricao: null,
          cor: configuracao.cor,
          ordem: configuracao.ordem,
          ativo: true
        }
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintViolation(error)) {
        throw error;
      }
    }
  }

  async ensureControleChamadosSolution(): Promise<void> {
    await retryBootstrapAfterUniqueConflict(() => this.ensureControleChamadosSolutionOnce());
  }

  private async ensureControleChamadosSolutionOnce(): Promise<void> {
    const existingSolucao = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: CONTROLE_CHAMADOS_PRODUTO.slug },
      select: { id: true }
    })) as { id: number } | null;

    const solucao = existingSolucao
      ? (await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
          where: { id: existingSolucao.id },
          data: {
            nome: CONTROLE_CHAMADOS_PRODUTO.nome,
            descricao: CONTROLE_CHAMADOS_PRODUTO.descricao,
            eyebrow: CONTROLE_CHAMADOS_PRODUTO.eyebrow,
            ativo: CONTROLE_CHAMADOS_PRODUTO.ativo,
            exibirNoHub: CONTROLE_CHAMADOS_PRODUTO.exibirNoHub,
            somenteAdminSistema: CONTROLE_CHAMADOS_PRODUTO.somenteAdminSistema,
            padraoSistema: true
          },
          select: { id: true }
        })) as { id: number }
      : (await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
          data: {
            slug: CONTROLE_CHAMADOS_PRODUTO.slug,
            nome: CONTROLE_CHAMADOS_PRODUTO.nome,
            descricao: CONTROLE_CHAMADOS_PRODUTO.descricao,
            eyebrow: CONTROLE_CHAMADOS_PRODUTO.eyebrow,
            ordem: CONTROLE_CHAMADOS_PRODUTO.ordem,
            ativo: CONTROLE_CHAMADOS_PRODUTO.ativo,
            exibirNoHub: CONTROLE_CHAMADOS_PRODUTO.exibirNoHub,
            somenteAdminSistema: CONTROLE_CHAMADOS_PRODUTO.somenteAdminSistema,
            padraoSistema: true
          },
          select: { id: true }
        })) as { id: number };

    const features = CONTROLE_CHAMADOS_PRODUTO.funcionalidades;

    for (const feature of features) {
      const existing = (await (this.prisma as never as { funcionalidade: { findUnique: Function } }).funcionalidade.findUnique({
        where: {
          solucaoId_slug: {
            solucaoId: solucao.id,
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
              providerKey: existing.providerKey ?? feature.registryKey,
              providerVersion: existing.providerVersion ?? 1,
              somenteAdminSistema: feature.somenteAdminSistema,
              padraoSistema: true
            }
          })) as FuncionalidadeRecord
        : (await (this.prisma as never as { funcionalidade: { create: Function } }).funcionalidade.create({
            data: {
              solucaoId: solucao.id,
              slug: feature.slug,
              titulo: feature.titulo,
              label: feature.label,
              descricao: feature.descricao,
              ordem: feature.ordem,
              ativo: feature.ativo,
              registryKey: feature.registryKey,
              providerKey: feature.providerKey,
              providerVersion: feature.providerVersion,
              somenteAdminSistema: feature.somenteAdminSistema,
              padraoSistema: true
            }
          })) as FuncionalidadeRecord;

      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(funcionalidade.id, feature.acoes, { preserveAdditionalActions: true });

      if (!existing) {
        await this.solucaoAcessoService.syncNewFuncionalidadeAccess(funcionalidade);
      }
    }

    for (const agrupamento of CONTROLE_CHAMADOS_PRODUTO.agrupamentos) {
      await this.agrupamentos.ensureAgrupamentoPadrao(solucao.id, agrupamento);
    }
  }


  private async findControleChamadosCompanyAccess(empresaId: number): Promise<{ id: number } | null> {
    const acessoSolucao = await (this.prisma as never as { empresaSolucao: { findFirst: Function } }).empresaSolucao.findFirst({
      where: {
        empresaId,
        solucao: { slug: CONTROLE_CHAMADOS_PRODUTO.slug }
      },
      select: { id: true }
    }) as { id: number } | null;

    if (acessoSolucao) {
      return acessoSolucao;
    }

    return await (this.prisma as never as { empresaFuncionalidade: { findFirst: Function } }).empresaFuncionalidade.findFirst({
      where: {
        empresaId,
        funcionalidade: { solucao: { slug: CONTROLE_CHAMADOS_PRODUTO.slug } }
      },
      select: { id: true }
    }) as { id: number } | null;
  }
}

type ChamadoConfiguracaoDelegate = {
  findFirst: Function;
  create: Function;
};

type DefaultChamadoConfiguracao = {
  nome: string;
  cor: string;
  ordem: number;
};
