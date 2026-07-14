import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAberturaService } from './chamado-abertura.service';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAnexoService } from './chamado-anexo.service';
import { ChamadoAtendimentoService } from './chamado-atendimento.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoCategoriaService } from './chamado-categoria.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoRelatorioService } from './chamado-relatorio.service';
import { ChamadoMensagemService } from './chamado-mensagem.service';
import { ChamadoNotificacaoService } from './chamado-notificacao.service';
import { ChamadoDashboardService } from './chamado-dashboard.service';
import { ChamadoGoogleEmailService } from './chamado-google-email.service';
import { ChamadoPrioridadeService } from './chamado-prioridade.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { ChamadoSlaConfigService } from './chamado-sla-config.service';
import { ChamadoStatusService } from './chamado-status.service';
import { CLOSED_STATUSES, FEATURES, STATUS } from './constants/chamado.constants';
import { AlterarCategoriaChamadoInput } from './dto/alterar-categoria-chamado.input';
import { AlterarPrioridadeChamadoInput } from './dto/alterar-prioridade-chamado.input';
import { AlterarStatusChamadoInput } from './dto/alterar-status-chamado.input';
import { AtribuirChamadoInput } from './dto/atribuir-chamado.input';
import { AtendenteChamadoType } from './dto/atendente-chamado.type';
import { AtualizarChamadoAcompanhantesInput } from './dto/chamado-acompanhante.input';
import { ChamadoAnexoType } from './dto/chamado-anexo.type';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoPrioridadeInput, UpdateChamadoPrioridadeInput } from './dto/chamado-prioridade.input';
import { ChamadoPrioridadeType } from './dto/chamado-prioridade.type';
import { CreateChamadoResponsavelInput, UpdateChamadoResponsavelInput } from './dto/chamado-responsavel.input';
import { ChamadoResponsavelOptionsType, ChamadoResponsavelType, ChamadoResponsavelUsuarioOptionType } from './dto/chamado-responsavel.type';
import { CreateChamadoSlaRegraInput, UpdateChamadoSlaRegraInput } from './dto/chamado-sla-regra.input';
import { ChamadoSlaRegraType } from './dto/chamado-sla-regra.type';
import { CreateChamadoTipoInput, UpdateChamadoTipoInput } from './dto/chamado-tipo.input';
import { ChamadoTipoType } from './dto/chamado-tipo.type';
import { ChamadoFiltroInput } from './dto/chamado-filtro.input';
import { ChamadoDashboardType } from './dto/chamado-dashboard.type';
import { ChamadoRelatorioFiltroInput } from './dto/chamado-relatorio.input';
import { ChamadoRelatorioPageType } from './dto/chamado-relatorio.type';
import { ChamadoNotificacaoType } from './dto/chamado-notificacao.type';
import { ChamadoSolucaoEmailType, CreateChamadoSolucaoEmailInput, CreateGoogleEmailContaInput, GoogleEmailContaType, GoogleSendAsType, UpdateChamadoSolucaoEmailInput, UpdateGoogleEmailContaInput } from './dto/chamado-google-email.type';
import { ChamadoPageType, ChamadoType } from './dto/chamado.type';
import { CriarChamadoInput } from './dto/criar-chamado.input';
import { ResponderChamadoInput } from './dto/responder-chamado.input';
import { toChamadoType } from './mappers/chamado.mapper';
import { ChamadoQueryService } from './queries/chamado-query.service';
import { ChamadoUploadFile } from './types/chamado-record.types';
export type { ChamadoUploadFile } from './types/chamado-record.types';
@Injectable()
export class ChamadosService {
  constructor(
    private readonly chamadoAbertura: ChamadoAberturaService,
    private readonly chamadoDashboard: ChamadoDashboardService,
    private readonly chamadoRelatorio: ChamadoRelatorioService,
    private readonly chamadoAnexo: ChamadoAnexoService,
    private readonly chamadoAtendimento: ChamadoAtendimentoService,
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoConfiguracao: ChamadoConfiguracaoService,
    private readonly chamadoCategoria: ChamadoCategoriaService,
    private readonly chamadoMensagem: ChamadoMensagemService,
    private readonly chamadoPrioridade: ChamadoPrioridadeService,
    private readonly chamadoResponsavel: ChamadoResponsavelService,
    private readonly chamadoSlaConfig: ChamadoSlaConfigService,
    private readonly chamadoNotificacao: ChamadoNotificacaoService,
    private readonly chamadoGoogleEmail: ChamadoGoogleEmailService,
    private readonly chamadoStatus: ChamadoStatusService,
    private readonly chamadoAcompanhante: ChamadoAcompanhanteService
  ) {}

  async relatorioChamados(filtro: ChamadoRelatorioFiltroInput | null | undefined, user: JwtPayload): Promise<ChamadoRelatorioPageType> { return this.chamadoRelatorio.listar(filtro, user); }
  async exportarRelatorioChamados(filtro: ChamadoRelatorioFiltroInput | null | undefined, formato: 'csv' | 'xlsx', user: JwtPayload) { return this.chamadoRelatorio.exportar(filtro, formato, user); }

  async dashboardChamados(user: JwtPayload): Promise<ChamadoDashboardType> { return this.chamadoDashboard.obter(user); }

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
    const chamadoId = await this.chamadoAbertura.criarChamado(input, user);
    return this.chamado(chamadoId, user);
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

  async alterarCategoriaChamado(input: AlterarCategoriaChamadoInput, user: JwtPayload): Promise<ChamadoType> { const chamadoId = await this.chamadoCategoria.alterarCategoriaChamado(input, user); return this.chamado(chamadoId, user); }

  async alterarPrioridadeChamado(input: AlterarPrioridadeChamadoInput, user: JwtPayload): Promise<ChamadoType> {
    const chamadoId = await this.chamadoPrioridade.alterarPrioridadeChamado(input, user);
    return this.chamado(chamadoId, user);
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

  async notificacoesChamado(user: JwtPayload, limite = 30): Promise<ChamadoNotificacaoType[]> {
    return this.chamadoNotificacao.listar(user, limite);
  }

  async notificacoesNaoLidas(user: JwtPayload): Promise<number> {
    return this.chamadoNotificacao.naoLidas(user);
  }

  async marcarNotificacaoComoLida(id: string, user: JwtPayload): Promise<boolean> {
    return this.chamadoNotificacao.marcarComoLida(id, user);
  }

  async marcarTodasNotificacoesComoLidas(user: JwtPayload): Promise<number> {
    return this.chamadoNotificacao.marcarTodasComoLidas(user);
  }

  async googleEmailContas(user: JwtPayload): Promise<GoogleEmailContaType[]> { return this.chamadoGoogleEmail.contas(user); }
  async googleEmailSendAs(contaId: number, user: JwtPayload): Promise<GoogleSendAsType[]> { return this.chamadoGoogleEmail.sendAs(contaId, user); }
  async chamadoSolucoesEmails(user: JwtPayload): Promise<ChamadoSolucaoEmailType[]> { return this.chamadoGoogleEmail.solucoesEmails(user); }
  async googleEmailAuthUrl(id: number, user: JwtPayload): Promise<string> { return this.chamadoGoogleEmail.authUrl(id, user); }
  async createGoogleEmailConta(input: CreateGoogleEmailContaInput, user: JwtPayload): Promise<GoogleEmailContaType> { return this.chamadoGoogleEmail.createConta(input, user); }
  async updateGoogleEmailConta(input: UpdateGoogleEmailContaInput, user: JwtPayload): Promise<GoogleEmailContaType> { return this.chamadoGoogleEmail.updateConta(input, user); }
  async deleteGoogleEmailConta(id: number, user: JwtPayload): Promise<boolean> { return this.chamadoGoogleEmail.deleteConta(id, user); }
  async createChamadoSolucaoEmail(input: CreateChamadoSolucaoEmailInput, user: JwtPayload): Promise<ChamadoSolucaoEmailType> { return this.chamadoGoogleEmail.createSolucaoEmail(input, user); }
  async updateChamadoSolucaoEmail(input: UpdateChamadoSolucaoEmailInput, user: JwtPayload): Promise<ChamadoSolucaoEmailType> { return this.chamadoGoogleEmail.updateSolucaoEmail(input, user); }
  async deleteChamadoSolucaoEmail(id: number, user: JwtPayload): Promise<boolean> { return this.chamadoGoogleEmail.deleteSolucaoEmail(id, user); }
  async regrasSlaChamado(user: JwtPayload, ativas = true): Promise<ChamadoSlaRegraType[]> {
    return this.chamadoSlaConfig.regrasSlaChamado(user, ativas);
  }

  async createRegraSla(input: CreateChamadoSlaRegraInput, user: JwtPayload): Promise<ChamadoSlaRegraType> {
    return this.chamadoSlaConfig.createRegra(input, user);
  }

  async updateRegraSla(input: UpdateChamadoSlaRegraInput, user: JwtPayload): Promise<ChamadoSlaRegraType> {
    return this.chamadoSlaConfig.updateRegra(input, user);
  }

  async deleteRegraSla(id: number, user: JwtPayload): Promise<boolean> {
    return this.chamadoSlaConfig.deleteRegra(id, user);
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

}
