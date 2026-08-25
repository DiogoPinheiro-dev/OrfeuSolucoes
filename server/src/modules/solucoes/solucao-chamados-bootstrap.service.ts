import { Injectable } from '@nestjs/common';
import { isPrismaUniqueConstraintViolation, retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
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
      await this.ensureDefaultConfiguracao(
        (this.prisma as never as { chamadoTipo: ChamadoConfiguracaoDelegate }).chamadoTipo,
        empresaId,
        tipo
      );
    }

    for (const prioridade of DEFAULT_CHAMADO_PRIORIDADES) {
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
            ativo: true,
            exibirNoHub: true,
            somenteAdminSistema: false,
            padraoSistema: true
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
            somenteAdminSistema: false,
            padraoSistema: true
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
        descricao: 'Registre uma nova solicitação de atendimento para a empresa selecionada.',
        ordem: 10,
        registryKey: 'controle-de-chamados.abrir-chamado'
      },
      {
        slug: 'meus-chamados',
        titulo: 'Meus chamados',
        label: 'Minhas solicitações',
        descricao: 'Acompanhe chamados abertos por você, responda e solicite reabertura quando necessário.',
        ordem: 20,
        registryKey: 'controle-de-chamados.meus-chamados',
        acoes: [
          {
            chave: 'responder_proprio_chamado',
            nome: 'Responder próprio chamado', configuracao: 'responder_proprio_chamado',
            descricao: 'Permite adicionar respostas públicas nos próprios chamados.',
            ordem: 50,
            ativo: true
          },
          {
            chave: 'reabrir_proprio_chamado',
            nome: 'Reabrir próprio chamado', configuracao: 'reabrir_proprio_chamado',
            descricao: 'Permite reabrir chamados próprios que foram resolvidos.',
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
          { chave: 'alterar_categoria', nome: 'Alterar categoria', configuracao: 'alterar_categoria', ordem: 115, ativo: true },
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
        descricao: 'Configure categorias de chamados específicas da empresa selecionada.',
        ordem: 50,
        registryKey: 'controle-de-chamados.categorias'
      },
      {
        slug: 'responsaveis',
        titulo: 'Cadastro de responsáveis',
        label: 'Responsáveis',
        descricao: 'Cadastre supervisores e responsáveis por solução ou funcionalidade.',
        ordem: 60,
        registryKey: 'controle-de-chamados.responsaveis'
      },
      {
        slug: 'tipos',
        titulo: 'Tipos de chamados',
        label: 'Tipos',
        descricao: 'Configure os tipos usados na abertura e classificação dos chamados.',
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
      },
      {
        slug: 'sla',
        titulo: 'Regras de SLA',
        label: 'SLA',
        descricao: 'Configure prazos de primeira resposta e resolução por prioridade.',
        ordem: 90,
        registryKey: 'controle-de-chamados.sla'
      },
      {
        slug: 'dashboard',
        titulo: 'Dashboard de chamados',
        label: 'Dashboard',
        descricao: 'Acompanhe volume, SLA e tempos médios da operação de atendimento.',
        ordem: 45,
        registryKey: 'controle-de-chamados.dashboard'
      },
      {
        slug: 'relatorios',
        titulo: 'Relatórios de chamados',
        label: 'Relatórios',
        descricao: 'Consulte chamados por período e filtros operacionais, com exportação CSV ou Excel.',
        ordem: 110,
        registryKey: 'controle-de-chamados.relatorios'
      },
      {
        slug: 'emails-solucoes',
        titulo: 'Configuração de e-mail',
        label: 'E-mail',
        descricao: 'Conecte a conta Google principal usada nas notificações automáticas dos chamados.',
        ordem: 100,
        registryKey: 'controle-de-chamados.emails-solucoes'
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
              ativo: true,
              registryKey: feature.registryKey,
              somenteAdminSistema: false,
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
              ativo: true,
              registryKey: feature.registryKey,
              somenteAdminSistema: false,
              padraoSistema: true
            }
          })) as FuncionalidadeRecord;

      await this.funcionalidadeAcaoService.syncFuncionalidadeAcoes(funcionalidade.id, feature.acoes, { preserveAdditionalActions: true });

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

type ChamadoConfiguracaoDelegate = {
  findFirst: Function;
  create: Function;
};

type DefaultChamadoConfiguracao = {
  nome: string;
  cor: string;
  ordem: number;
};
