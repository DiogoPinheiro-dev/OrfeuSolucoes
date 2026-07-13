import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_CHAMADO_PRIORIDADES, DEFAULT_CHAMADO_TIPOS } from './constants/solucao.constants';
import { FuncionalidadeAcaoInput } from './dto/funcionalidade-acao.input';
import { FuncionalidadeAcaoService } from './funcionalidade-acao.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { FuncionalidadeRecord } from './types/solucao-record.types';

@Injectable()
export class SolucaoChamadosBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funcionalidadeAcaoService: FuncionalidadeAcaoService,
    private readonly solucaoAcessoService: SolucaoAcessoService
  ) {}

  async ensureDefaultChamadoConfiguracoesForEmpresa(empresaId: number, force = false): Promise<void> {
    const acessoControleChamados = force
      ? { id: 0 }
      : await this.findControleChamadosCompanyAccess(empresaId);

    if (!acessoControleChamados) {
      return;
    }

    for (const tipo of DEFAULT_CHAMADO_TIPOS) {
      const existing = await (this.prisma as never as { chamadoTipo: { findFirst: Function } }).chamadoTipo.findFirst({
        where: { empresaId, nome: tipo.nome },
        select: { id: true }
      }) as { id: number } | null;

      if (!existing) {
        await (this.prisma as never as { chamadoTipo: { create: Function } }).chamadoTipo.create({
          data: {
            empresaId,
            nome: tipo.nome,
            descricao: null,
            cor: tipo.cor,
            ordem: tipo.ordem,
            ativo: true
          }
        });
      }
    }

    for (const prioridade of DEFAULT_CHAMADO_PRIORIDADES) {
      const existing = await (this.prisma as never as { chamadoPrioridade: { findFirst: Function } }).chamadoPrioridade.findFirst({
        where: { empresaId, nome: prioridade.nome },
        select: { id: true }
      }) as { id: number } | null;

      if (!existing) {
        await (this.prisma as never as { chamadoPrioridade: { create: Function } }).chamadoPrioridade.create({
          data: {
            empresaId,
            nome: prioridade.nome,
            descricao: null,
            cor: prioridade.cor,
            ordem: prioridade.ordem,
            ativo: true
          }
        });
      }
    }
  }


  async ensureControleChamadosSolution(): Promise<void> {
    const existingSolucao = (await (this.prisma as never as { solucao: { findUnique: Function } }).solucao.findUnique({
      where: { slug: 'controle-de-chamados' },
      select: { id: true }
    })) as { id: number } | null;

    const solucao = existingSolucao
      ? (await (this.prisma as never as { solucao: { update: Function } }).solucao.update({
          where: { id: existingSolucao.id },
          data: {
            nome: 'Controle de Chamados',
            descricao: 'Abertura, acompanhamento e atendimento de chamados por empresa.',
            eyebrow: 'Atendimento',
            ordem: 40,
            ativo: true,
            exibirNoHub: true,
            somenteAdminSistema: false
          },
          select: { id: true }
        })) as { id: number }
      : (await (this.prisma as never as { solucao: { create: Function } }).solucao.create({
          data: {
            slug: 'controle-de-chamados',
            nome: 'Controle de Chamados',
            descricao: 'Abertura, acompanhamento e atendimento de chamados por empresa.',
            eyebrow: 'Atendimento',
            ordem: 40,
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
        slug: 'abrir-chamado',
        titulo: 'Abrir chamado',
        label: 'Novo chamado',
        descricao: 'Registre uma nova solicitacao de atendimento para a empresa selecionada.',
        ordem: 10,
        registryKey: 'controle-de-chamados.abrir-chamado'
      },
      {
        slug: 'meus-chamados',
        titulo: 'Meus chamados',
        label: 'Minhas solicitacoes',
        descricao: 'Acompanhe chamados abertos por voce, responda e solicite reabertura quando necessario.',
        ordem: 20,
        registryKey: 'controle-de-chamados.meus-chamados',
        acoes: [
          {
            chave: 'responder_proprio_chamado',
            nome: 'Responder proprio chamado', configuracao: 'responder_proprio_chamado',
            descricao: 'Permite adicionar respostas publicas nos proprios chamados.',
            ordem: 50,
            ativo: true
          },
          {
            chave: 'reabrir_proprio_chamado',
            nome: 'Reabrir proprio chamado', configuracao: 'reabrir_proprio_chamado',
            descricao: 'Permite reabrir chamados proprios que foram resolvidos.',
            ordem: 60,
            ativo: true
          }
        ]
      },
      {
        slug: 'painel-atendimento',
        titulo: 'Painel de atendimento',
        label: 'Fila de atendimento',
        descricao: 'Visualize a fila da empresa, assuma, atribua, responda e movimente chamados.',
        ordem: 30,
        registryKey: 'controle-de-chamados.painel-atendimento',
        acoes: [
          { chave: 'visualizar_fila', nome: 'Visualizar fila', configuracao: 'visualizar_fila', ordem: 50, ativo: true },
          { chave: 'assumir_chamado', nome: 'Assumir chamado', configuracao: 'assumir_chamado', ordem: 60, ativo: true },
          { chave: 'atribuir_chamado', nome: 'Atribuir chamado', configuracao: 'atribuir_chamado', ordem: 70, ativo: true },
          { chave: 'transferir_chamado', nome: 'Transferir chamado', configuracao: 'transferir_chamado', ordem: 80, ativo: true },
          { chave: 'responder_chamado', nome: 'Responder chamado', configuracao: 'responder_chamado', ordem: 90, ativo: true },
          { chave: 'adicionar_nota_interna', nome: 'Adicionar nota interna', configuracao: 'adicionar_nota_interna', ordem: 100, ativo: true },
          { chave: 'alterar_prioridade', nome: 'Alterar prioridade', configuracao: 'alterar_prioridade', ordem: 110, ativo: true },
          { chave: 'alterar_status', nome: 'Alterar status', configuracao: 'alterar_status', ordem: 120, ativo: true },
          { chave: 'resolver_chamado', nome: 'Resolver chamado', configuracao: 'resolver_chamado', ordem: 130, ativo: true },
          { chave: 'encerrar_chamado', nome: 'Encerrar chamado', configuracao: 'encerrar_chamado', ordem: 140, ativo: true },
          { chave: 'reabrir_chamado', nome: 'Reabrir chamado', configuracao: 'reabrir_chamado', ordem: 150, ativo: true }
        ]
      },
      {
        slug: 'chamados-arquivados',
        titulo: 'Chamados arquivados',
        label: 'Arquivados',
        descricao: 'Visualize chamados arquivados e permita desarquivamento controlado por administradores.',
        ordem: 40,
        registryKey: 'controle-de-chamados.chamados-arquivados',
        acoes: [
          { chave: 'reabrir_chamado', nome: 'Desarquivar chamado', configuracao: 'reabrir_chamado', ordem: 50, ativo: true }
        ]
      },
      {
        slug: 'categorias',
        titulo: 'Categorias de chamados',
        label: 'Categorias',
        descricao: 'Configure categorias de chamados especificas da empresa selecionada.',
        ordem: 50,
        registryKey: 'controle-de-chamados.categorias'
      },
      {
        slug: 'responsaveis',
        titulo: 'Cadastro de responsaveis',
        label: 'Responsaveis',
        descricao: 'Cadastre supervisores e responsaveis por solucao ou funcionalidade.',
        ordem: 60,
        registryKey: 'controle-de-chamados.responsaveis'
      },
      {
        slug: 'tipos',
        titulo: 'Tipos de chamados',
        label: 'Tipos',
        descricao: 'Configure os tipos usados na abertura e classificacao dos chamados.',
        ordem: 70,
        registryKey: 'controle-de-chamados.tipos'
      },
      {
        slug: 'prioridades',
        titulo: 'Prioridades de chamados',
        label: 'Prioridades',
        descricao: 'Configure as prioridades usadas na triagem e atendimento dos chamados.',
        ordem: 80,
        registryKey: 'controle-de-chamados.prioridades'
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


  private async findControleChamadosCompanyAccess(empresaId: number): Promise<{ id: number } | null> {
    const acessoSolucao = await (this.prisma as never as { empresaSolucao: { findFirst: Function } }).empresaSolucao.findFirst({
      where: {
        empresaId,
        solucao: { slug: 'controle-de-chamados' }
      },
      select: { id: true }
    }) as { id: number } | null;

    if (acessoSolucao) {
      return acessoSolucao;
    }

    return await (this.prisma as never as { empresaFuncionalidade: { findFirst: Function } }).empresaFuncionalidade.findFirst({
      where: {
        empresaId,
        funcionalidade: { solucao: { slug: 'controle-de-chamados' } }
      },
      select: { id: true }
    }) as { id: number } | null;
  }
}