import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJETO_FEATURE_DEFINITIONS } from './constants/projeto-feature-definitions';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { FuncionalidadeRecord } from './types/solucao-record.types';

@Injectable()
export class SolucaoProjetosBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService,
    private readonly solucaoAcessoService: SolucaoAcessoService
  ) {}

  async ensureProjetosSolution(): Promise<void> {
    const existingSolucao = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: 'projetos' },
      select: { id: true }
    })) as { id: number } | null;

    const solucao = existingSolucao
      ? (await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
          where: { id: existingSolucao.id },
          data: {
            nome: 'Gerenciador de Projetos',
            descricao: 'Espaco para organizar projetos, backlog, entregas, marcos e comunicacao entre as equipes.',
            eyebrow: 'Operacao',
            ordem: 10,
            ativo: true,
            exibirNoHub: true,
            somenteAdminSistema: false
          },
          select: { id: true }
        })) as { id: number }
      : (await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
          data: {
            slug: 'projetos',
            nome: 'Gerenciador de Projetos',
            descricao: 'Espaco para organizar projetos, backlog, entregas, marcos e comunicacao entre as equipes.',
            eyebrow: 'Operacao',
            ordem: 10,
            ativo: true,
            exibirNoHub: true,
            somenteAdminSistema: false
          },
          select: { id: true }
        })) as { id: number };

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
      const funcionalidade = existing
        ? (await (this.prisma as never as { funcionalidade: { update: Function } }).funcionalidade.update({
            where: { id: existing.id },
            data: {
              titulo: feature.titulo,
              label: feature.label,
              descricao: feature.descricao,
              ordem: feature.ordem,
              ativo: feature.ativo,
              registryKey: feature.registryKey,
              somenteAdminSistema: false
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
              somenteAdminSistema: false
            }
          })) as FuncionalidadeRecord;

      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(funcionalidade.id, feature.acoes);

      if (!existing) {
        await this.solucaoAcessoService.syncNewFuncionalidadeAccess(funcionalidade);
      }
    }
  }
}
