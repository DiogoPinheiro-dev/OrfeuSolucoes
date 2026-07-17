import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FuncionalidadeAcaoInput } from './dto/funcionalidade-acao.input';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
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
    private readonly solucaoProjetosBootstrap: SolucaoProjetosBootstrapService
  ) {}

  async ensureDefaultChamadoConfiguracoesForEmpresa(empresaId: number, force = false): Promise<void> {
    return this.solucaoChamadosBootstrap.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId, force);
  }

  async ensureDefaultConfiguradorFeatures(): Promise<void> {
    const configurador = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: 'configurador' },
      select: { id: true }
    })) as { id: number } | null;

    if (!configurador) {
      return;
    }

    await this.mergeDuplicateConfiguradorFeature(
      configurador.id,
      'cadastro-de-soluções',
      'cadastro-de-solucoes'
    );

    const defaultFeatures = [
      {
        slug: 'cadastro-de-solucoes',
        titulo: 'Cadastro de solucoes',
        label: 'Solucoes',
        descricao: 'Crie e mantenha as solucoes exibidas no hub do sistema.',
        ordem: 35,
        registryKey: 'configurador.cadastro-de-solucoes'
      }
    ];

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
              ordem: feature.ordem,
              ativo: true,
              registryKey: feature.registryKey,
              somenteAdminSistema: true
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
              ativo: true,
              registryKey: feature.registryKey,
              somenteAdminSistema: true
            }
          })) as FuncionalidadeRecord;

      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(funcionalidade.id);

      if (!existing) {
        await this.solucaoAcessoService.syncNewFuncionalidadeAccess(funcionalidade);
      }
    }
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
