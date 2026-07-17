import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FuncionalidadeAcaoInput } from './dto/funcionalidade-acao.input';
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

    const features: Array<{
      slug: string;
      titulo: string;
      label: string;
      descricao: string;
      ordem: number;
      registryKey: string;
      acoes?: FuncionalidadeAcaoInput[];
    }> = [
      {
        slug: 'cadastro-de-projetos',
        titulo: 'Cadastro de projetos',
        label: 'Projetos',
        descricao: 'Cadastre projetos, responsaveis, participantes, metodologia e ciclo de vida.',
        ordem: 10,
        registryKey: 'projetos.cadastro-de-projetos',
        acoes: [
          {
            chave: 'gerenciar_membros',
            nome: 'Gerenciar membros',
            configuracao: 'gerenciar_membros',
            descricao: 'Permite adicionar, alterar e remover membros do projeto.',
            ordem: 50,
            ativo: true
          },
          {
            chave: 'alterar_status',
            nome: 'Alterar status',
            configuracao: 'alterar_status',
            descricao: 'Permite alterar o status e o ciclo de vida do projeto.',
            ordem: 60,
            ativo: true
          },
          {
            chave: 'reativar_projeto',
            nome: 'Reativar projeto',
            configuracao: 'reativar_projeto',
            descricao: 'Permite reativar projetos encerrados ou cancelados.',
            ordem: 70,
            ativo: true
          }
        ]
      },
      {
        slug: 'backlog-de-demandas',
        titulo: 'Backlog de demandas',
        label: 'Backlog',
        descricao: 'Organize demandas, prioridades e itens planejados para o projeto.',
        ordem: 20,
        registryKey: 'projetos.backlog-de-demandas'
      },
      {
        slug: 'marcos-e-entregas',
        titulo: 'Marcos e entregas',
        label: 'Marcos e entregas',
        descricao: 'Acompanhe marcos, entregas previstas e resultados do projeto.',
        ordem: 30,
        registryKey: 'projetos.marcos-e-entregas'
      },
      {
        slug: 'comunicacao-do-projeto',
        titulo: 'Comunicacao do projeto',
        label: 'Comunicacao',
        descricao: 'Centralize comunicados, decisoes e alinhamentos do projeto.',
        ordem: 40,
        registryKey: 'projetos.comunicacao-do-projeto'
      }
    ];

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
              ativo: true,
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
              ativo: true,
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
