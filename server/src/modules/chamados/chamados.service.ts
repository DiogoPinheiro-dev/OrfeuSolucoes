import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from '../solucoes/solucoes.service';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAnexoService } from './chamado-anexo.service';
import { ChamadoAtendimentoService } from './chamado-atendimento.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { ChamadoMensagemService } from './chamado-mensagem.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { ChamadoStatusService } from './chamado-status.service';
import { AlterarPrioridadeChamadoInput } from './dto/alterar-prioridade-chamado.input';
import { AlterarStatusChamadoInput } from './dto/alterar-status-chamado.input';
import { AtribuirChamadoInput } from './dto/atribuir-chamado.input';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { AtualizarChamadoAcompanhantesInput } from './dto/chamado-acompanhante.input';
import { ChamadoAcompanhanteType } from './dto/chamado-acompanhante.type';
import { ChamadoAnexoType } from './dto/chamado-anexo.type';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoPrioridadeInput, UpdateChamadoPrioridadeInput } from './dto/chamado-prioridade.input';
import { ChamadoPrioridadeType } from './dto/chamado-prioridade.type';
import { CreateChamadoTipoInput, UpdateChamadoTipoInput } from './dto/chamado-tipo.input';
import { ChamadoTipoType } from './dto/chamado-tipo.type';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { CreateChamadoResponsavelInput, UpdateChamadoResponsavelInput } from './dto/chamado-responsavel.input';
import { ChamadoFiltroInput } from './dto/chamado-filtro.input';
import { ChamadoResponsavelOptionsType, ChamadoResponsavelType, ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
import { ChamadoHistoricoType, ChamadoMensagemType, ChamadoPageType, ChamadoType } from './dto/chamado.type';
import { CriarChamadoInput } from './dto/criar-chamado.input';
import { ResponderChamadoInput } from './dto/responder-chamado.input';
export type { ChamadoUploadFile } from './types/chamado-record.types';
import { ChamadoQueryService } from './queries/chamado-query.service';
import { assertStatusTransition, isClosedStatus, isTerminalStatus } from './policies/chamado-status.policy';
import {
  CLOSED_STATUSES,
  FEATURES,
  OPEN_STATUSES,
  SOLUTION_SLUG,
  STATUS,
} from './constants/chamado.constants';
import { chamadoSummaryInclude } from './constants/chamado-prisma.constants';
import {
  chamadoResponsavelLabel,
  responsavelLabel,
  responsavelRecordToAtendente,
  responsavelRecordToPayload,
  toCategoriaType,
  toChamadoType,
  toPrioridadeType,
  toResponsavelType,
  toTipoType,
  usuarioLabel
} from './mappers/chamado.mapper';
import {
  ChamadoAcompanhanteRecord,
  ChamadoCategoriaRecord,
  ChamadoConfiguracaoRecord,
  ChamadoRecord,
  ChamadoResponsavelFuncionalidadeRecord,
  ChamadoResponsavelRecord,
  ChamadoResponsavelSolucaoRecord,
  GrupoResumoRecord,
  ResponsavelAlvoPayload,
  ResponsavelAberturaPayload,
  ResponsavelSolucaoPayload,
  UsuarioResumoRecord,
  ChamadoUploadFile
} from './types/chamado-record.types';

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService,
    private readonly chamadoAnexo: ChamadoAnexoService,
    private readonly chamadoAtendimento: ChamadoAtendimentoService,
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoConfiguracao: ChamadoConfiguracaoService,
    private readonly chamadoHistory: ChamadoHistoryService,
    private readonly chamadoMensagem: ChamadoMensagemService,
    private readonly chamadoResponsavel: ChamadoResponsavelService,
    private readonly chamadoStatus: ChamadoStatusService,
    private readonly chamadoAcompanhante: ChamadoAcompanhanteService
  ) {}

  async meusChamados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.meus, 'visualizar');

    return this.chamadoQuery.findChamadosPage(empresaId, filtro, {
      NOT: { status: { in: [...CLOSED_STATUSES] } },
      OR: [
        { solicitanteId: user.sub },
        { acompanhantes: { some: { usuarioId: user.sub, ativo: true } } }
      ]
    }, this.normalizeValue.bind(this));
  }

  async filaChamados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'visualizar_fila');

    return this.chamadoQuery.findChamadosPage(empresaId, filtro, { NOT: { status: { in: [...CLOSED_STATUSES] } } }, this.normalizeValue.bind(this));
  }

  async chamadosArquivados(user: JwtPayload, filtro?: ChamadoFiltroInput | null): Promise<ChamadoPageType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.arquivados, 'visualizar');

    const archivedFiltro = filtro ? { ...filtro, status: null } : { status: null };

    return this.chamadoQuery.findChamadosPage(empresaId, archivedFiltro, { status: 'ARQUIVADO' }, this.normalizeValue.bind(this));
  }

  async chamado(id: string, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(id, empresaId, true);

    await this.authorization.assertCanViewChamado(user, chamado);

    return toChamadoType(chamado);
  }

  async criarChamado(input: CriarChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.abrir, 'incluir');
    await this.chamadoConfiguracao.ensureDefaultChamadoConfiguracoes(empresaId);

    const tipo = await this.chamadoConfiguracao.ensureTipoChamado(empresaId, input.tipoId);
    const prioridade = await this.chamadoConfiguracao.ensurePrioridadeChamado(empresaId, input.prioridadeId);
    const titulo = this.requiredText(input.titulo, 'titulo');
    const descricao = this.requiredText(input.descricao, 'descricao');
    const contexto = await this.chamadoResponsavel.resolveChamadoContext(input.solucaoId, input.funcionalidadeId ?? null);
    const responsavelAbertura = await this.chamadoResponsavel.resolveResponsavelAbertura(
      empresaId,
      contexto.solucaoId,
      contexto.funcionalidadeId,
      input.responsavelId ?? null,
      input.responsavelGrupoId ?? null
    );
    const acompanhantesAbertura = await this.chamadoAcompanhante.resolveAcompanhantesPayload(
      empresaId,
      input.acompanhanteIds ?? [],
      {
        solicitanteId: user.sub,
        responsavelId: responsavelAbertura.responsavelId
      }
    );

    if (input.categoriaId) {
      await this.chamadoConfiguracao.ensureCategoria(input.categoriaId, empresaId, true);
    }

    const created = (await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoSequencia: { upsert: Function };
        chamado: { create: Function };
        chamadoHistorico: { create: Function };
        chamadoAcompanhante: { createMany: Function };
      };
      const sequencia = (await db.chamadoSequencia.upsert({
        where: { empresaId },
        update: { proximoNumero: { increment: 1 } },
        create: { empresaId, proximoNumero: 2 }
      })) as { proximoNumero: number };
      const numero = sequencia.proximoNumero - 1;
      const chamado = (await db.chamado.create({
        data: {
          numero,
          empresaId,
          solicitanteId: user.sub,
          categoriaId: input.categoriaId ?? null,
          solucaoId: contexto.solucaoId,
          funcionalidadeId: contexto.funcionalidadeId,
          responsavelId: responsavelAbertura.responsavelId,
          responsavelGrupoId: responsavelAbertura.responsavelGrupoId,
          titulo,
          descricao,
          tipoId: tipo.id,
          prioridadeId: prioridade.id,
          status: 'ABERTO'
        },
        include: chamadoSummaryInclude
      })) as ChamadoRecord;

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          usuarioId: user.sub,
          evento: 'ABERTURA',
          campo: 'status',
          valorNovo: 'ABERTO',
          observacao: responsavelAbertura.responsavelId || responsavelAbertura.responsavelGrupoId ? 'Chamado aberto pelo solicitante com responsavel selecionado.' : 'Chamado aberto pelo solicitante.'
        }
      });

      if (acompanhantesAbertura.length) {
        await db.chamadoAcompanhante.createMany({
          data: acompanhantesAbertura.map((acompanhante) => ({
            chamadoId: chamado.id,
            empresaId,
            usuarioId: acompanhante.id,
            adicionadoPorId: user.sub,
            ativo: true
          }))
        });

        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorNovo: acompanhantesAbertura.map((acompanhante) => usuarioLabel(acompanhante)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes adicionados na abertura do chamado.'
          }
        });
      }

      return chamado;
    })) as ChamadoRecord;

    return this.chamado(created.id, user);
  }

  async responderChamado(input: ResponderChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const chamadoId = await this.chamadoMensagem.responderChamado(input, user);
    return this.chamado(chamadoId, user);
  }



  async adicionarAnexos(
    chamadoId: string,
    files: ChamadoUploadFile[],
    user: JwtPayload,
    mensagemId?: string | null
  ): Promise<ChamadoAnexoType[]> {
    return this.chamadoAnexo.adicionarAnexos(chamadoId, files, user, mensagemId);
  }

  async prepararDownloadAnexo(chamadoId: string, anexoId: string, user: JwtPayload): Promise<{
    caminhoAbsoluto: string;
    nomeOriginal: string;
    mimeType: string;
  }> {
    return this.chamadoAnexo.prepararDownloadAnexo(chamadoId, anexoId, user);
  }

  async assumirChamado(chamadoId: string, user: JwtPayload): Promise<ChamadoType> {
    const id = await this.chamadoAtendimento.assumirChamado(chamadoId, user);
    return this.chamado(id, user);
  }

  async liberarAtendimentoChamado(chamadoId: string, user: JwtPayload): Promise<ChamadoType> {
    const id = await this.chamadoAtendimento.liberarAtendimentoChamado(chamadoId, user);
    return this.chamado(id, user);
  }

  async atribuirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const id = await this.chamadoAtendimento.atribuirChamado(input, user);
    return this.chamado(id, user);
  }

  async transferirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const id = await this.chamadoAtendimento.transferirChamado(input, user);
    return this.chamado(id, user);
  }

  async alterarStatusChamado(input: AlterarStatusChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const chamadoId = await this.chamadoStatus.alterarStatusChamado(input, user);
    return this.chamado(chamadoId, user);
  }

  async alterarPrioridadeChamado(input: AlterarPrioridadeChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'alterar_prioridade');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const prioridade = await this.chamadoConfiguracao.ensurePrioridadeChamado(empresaId, input.prioridadeId);

    if (prioridade.id === chamado.prioridadeId) {
      return this.chamado(chamado.id, user);
    }

    await this.updateChamadoWithHistory(
      chamado,
      user,
      {
        prioridadeId: prioridade.id,
        versao: { increment: 1 }
      },
      [{
        evento: 'ALTERACAO_PRIORIDADE',
        campo: 'prioridade',
        valorAnterior: chamado.prioridadeConfiguracao?.nome ?? null,
        valorNovo: prioridade.nome
      }]
    );

    return this.chamado(chamado.id, user);
  }

  async resolverChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const id = await this.chamadoStatus.resolverChamado(chamadoId, user, observacao);
    return this.chamado(id, user);
  }

  async encerrarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const id = await this.chamadoStatus.encerrarChamado(chamadoId, user, observacao);
    return this.chamado(id, user);
  }

  async arquivarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const id = await this.chamadoStatus.arquivarChamado(chamadoId, user, observacao);
    return this.chamado(id, user);
  }

  async reabrirChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<ChamadoType> {
    const id = await this.chamadoStatus.reabrirChamado(chamadoId, user, observacao);
    return this.chamado(id, user);
  }


  async responsaveisChamado(user: JwtPayload, ativas = false): Promise<ChamadoResponsavelType[]> {
    return this.chamadoResponsavel.responsaveisChamado(user, ativas);
  }

  async responsaveisFiltroChamado(user: JwtPayload): Promise<ChamadoResponsavelType[]> {
    return this.chamadoResponsavel.responsaveisFiltroChamado(user);
  }
  async responsaveisChamadoOptions(user: JwtPayload): Promise<ChamadoResponsavelOptionsType> {
    return this.chamadoResponsavel.responsaveisChamadoOptions(user);
  }

  async createResponsavel(input: CreateChamadoResponsavelInput, user: JwtPayload): Promise<ChamadoResponsavelType> {
    return this.chamadoResponsavel.createResponsavel(input, user);
  }

  async updateResponsavel(input: UpdateChamadoResponsavelInput, user: JwtPayload): Promise<ChamadoResponsavelType> {
    return this.chamadoResponsavel.updateResponsavel(input, user);
  }

  async deleteResponsavel(id: number, user: JwtPayload): Promise<boolean> {
    return this.chamadoResponsavel.deleteResponsavel(id, user);
  }

  async categoriasChamado(user: JwtPayload, ativas = true): Promise<ChamadoCategoriaType[]> {
    return this.chamadoConfiguracao.categoriasChamado(user, ativas);
  }

  async createCategoria(input: CreateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    return this.chamadoConfiguracao.createCategoria(input, user);
  }

  async updateCategoria(input: UpdateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    return this.chamadoConfiguracao.updateCategoria(input, user);
  }

  async deleteCategoria(id: number, user: JwtPayload): Promise<boolean> {
    return this.chamadoConfiguracao.deleteCategoria(id, user);
  }
  async tiposChamado(user: JwtPayload, ativas = true): Promise<ChamadoTipoType[]> {
    return this.chamadoConfiguracao.tiposChamado(user, ativas);
  }

  async createTipo(input: CreateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    return this.chamadoConfiguracao.createTipo(input, user);
  }

  async updateTipo(input: UpdateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    return this.chamadoConfiguracao.updateTipo(input, user);
  }

  async deleteTipo(id: number, user: JwtPayload): Promise<boolean> {
    return this.chamadoConfiguracao.deleteTipo(id, user);
  }

  async prioridadesChamado(user: JwtPayload, ativas = true): Promise<ChamadoPrioridadeType[]> {
    return this.chamadoConfiguracao.prioridadesChamado(user, ativas);
  }

  async createPrioridade(input: CreateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    return this.chamadoConfiguracao.createPrioridade(input, user);
  }

  async updatePrioridade(input: UpdateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    return this.chamadoConfiguracao.updatePrioridade(input, user);
  }

  async deletePrioridade(id: number, user: JwtPayload): Promise<boolean> {
    return this.chamadoConfiguracao.deletePrioridade(id, user);
  }

  async atendentesDisponiveis(user: JwtPayload): Promise<AtendenteChamadoType[]> {
    return this.chamadoResponsavel.atendentesDisponiveis(user);
  }


  async opcoesAberturaChamado(user: JwtPayload): Promise<ChamadoResponsavelOptionsType> {
    return this.chamadoResponsavel.opcoesAberturaChamado(user);
  }

  async responsaveisParaAberturaChamado(user: JwtPayload, solucaoId: number, funcionalidadeId?: number | null): Promise<AtendenteChamadoType[]> {
    return this.chamadoResponsavel.responsaveisParaAberturaChamado(user, solucaoId, funcionalidadeId);
  }

  async acompanhantesElegiveisChamado(user: JwtPayload, chamadoId?: string | null): Promise<ChamadoResponsavelUsuarioOptionType[]> {
    return this.chamadoAcompanhante.acompanhantesElegiveisChamado(user, chamadoId);
  }

  async atualizarAcompanhantesChamado(input: AtualizarChamadoAcompanhantesInput, user: JwtPayload): Promise<ChamadoType> {
    const chamadoId = await this.chamadoAcompanhante.atualizarAcompanhantesChamado(input, user);
    return this.chamado(chamadoId, user);
  }

  private async updateStatus(
    chamado: ChamadoRecord,
    user: JwtPayload,
    status: string,
    observacao?: string | null,
    extraData: Record<string, unknown> = {}
  ): Promise<void> {
    return this.chamadoHistory.updateStatus(chamado, user, status, observacao, extraData);
  }

  private async updateChamadoWithHistory(
    chamado: ChamadoRecord,
    user: JwtPayload,
    data: Record<string, unknown>,
    historico: Array<{
      evento: string;
      campo?: string | null;
      valorAnterior?: string | null;
      valorNovo?: string | null;
      observacao?: string | null;
    }>
  ): Promise<void> {
    return this.chamadoHistory.updateChamadoWithHistory(chamado, user, data, historico);
  }

  private normalizeValue<T extends readonly string[]>(
    value: string | null | undefined,
    allowed: T,
    fallback: T[number] | undefined,
    fieldName: string
  ): T[number] {
    const normalized = (value || fallback || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') as T[number];

    if (!allowed.includes(normalized)) {
      throw new BadRequestException(`Valor invalido para ${fieldName}.`);
    }

    return normalized;
  }

  private requiredText(value: string, fieldName: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`Preencha ${fieldName}.`);
    }

    return normalized;
  }
}
