import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { FEATURES, OPEN_STATUSES } from './constants/chamado.constants';
import { AtribuirChamadoInput } from './dto/atribuir-chamado.input';
import { chamadoResponsavelLabel, usuarioLabel } from './mappers/chamado.mapper';
import { isTerminalStatus } from './policies/chamado-status.policy';
import { ChamadoQueryService } from './queries/chamado-query.service';
import { GrupoResumoRecord, UsuarioResumoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoAtendimentoService {
  constructor(
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoHistory: ChamadoHistoryService,
    private readonly chamadoResponsavel: ChamadoResponsavelService,
    private readonly chamadoAcompanhante: ChamadoAcompanhanteService
  ) {}

  async assumirChamado(chamadoId: string, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'assumir_chamado');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);
    const nextStatus = OPEN_STATUSES.includes(chamado.status as never) && chamado.status !== 'EM_ATENDIMENTO'
      ? 'EM_ATENDIMENTO'
      : chamado.status;
    const usuarioNome = user.nome || user.login || user.email;

    if (isTerminalStatus(chamado.status)) {
      throw new BadRequestException('Chamados resolvidos ou arquivados nao podem ser assumidos sem reabertura.');
    }

    if (chamado.liderAtendimentoId && chamado.liderAtendimentoId !== user.sub) {
      throw new BadRequestException(`Este chamado ja esta em atendimento por ${usuarioLabel(chamado.liderAtendimento) || 'outro usuario'}.`);
    }

    if (chamado.responsavelGrupoId) {
      await this.authorization.ensureUsuarioPertenceAoGrupoNaEmpresa(user.sub, empresaId, chamado.responsavelGrupoId);
      const liderAnteriorNome = usuarioLabel(chamado.liderAtendimento);

      await this.chamadoHistory.updateChamadoWithHistory(
        chamado,
        user,
        {
          liderAtendimentoId: user.sub,
          atendimentoAssumidoEm: chamado.liderAtendimentoId === user.sub ? chamado.atendimentoAssumidoEm ?? new Date() : new Date(),
          status: nextStatus,
          versao: { increment: 1 }
        },
        [
          {
            evento: 'LIDERANCA_ATENDIMENTO',
            campo: 'liderAtendimento',
            valorAnterior: liderAnteriorNome,
            valorNovo: usuarioNome,
            observacao: `Atendimento assumido pelo usuario dentro do grupo ${chamado.responsavelGrupo?.nome || 'responsavel'}.`
          },
          ...(nextStatus !== chamado.status
            ? [{
                evento: 'ALTERACAO_STATUS',
                campo: 'status',
                valorAnterior: chamado.status,
                valorNovo: nextStatus
              }]
            : [])
        ]
      );

      return chamado.id;
    }

    await this.chamadoHistory.updateChamadoWithHistory(
      chamado,
      user,
      {
        responsavelId: user.sub,
        responsavelGrupoId: null,
        liderAtendimentoId: null,
        atendimentoAssumidoEm: null,
        status: nextStatus,
        versao: { increment: 1 }
      },
      [
        {
          evento: 'ATRIBUICAO',
          campo: 'responsavel',
          valorAnterior: usuarioLabel(chamado.responsavel),
          valorNovo: usuarioNome,
          observacao: 'Chamado assumido pelo atendente.'
        },
        ...(nextStatus !== chamado.status
          ? [{
              evento: 'ALTERACAO_STATUS',
              campo: 'status',
              valorAnterior: chamado.status,
              valorNovo: nextStatus
            }]
          : [])
      ]
    );

    return chamado.id;
  }

  async liberarAtendimentoChamado(chamadoId: string, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'assumir_chamado');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (!chamado.liderAtendimentoId) {
      throw new BadRequestException('Este chamado nao possui atendimento assumido.');
    }

    if (chamado.liderAtendimentoId !== user.sub && !this.authorization.isSystemAdmin(user)) {
      throw new ForbiddenException('Apenas o lider atual do atendimento pode liberar este chamado.');
    }

    await this.chamadoHistory.updateChamadoWithHistory(
      chamado,
      user,
      {
        liderAtendimentoId: null,
        atendimentoAssumidoEm: null,
        versao: { increment: 1 }
      },
      [{
        evento: 'LIBERACAO_ATENDIMENTO',
        campo: 'liderAtendimento',
        valorAnterior: usuarioLabel(chamado.liderAtendimento),
        valorNovo: null,
        observacao: chamado.responsavelGrupoId
          ? `Atendimento liberado para o grupo ${chamado.responsavelGrupo?.nome || 'responsavel'}.`
          : 'Atendimento liberado.'
      }]
    );

    return chamado.id;
  }

  async atribuirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<string> {
    return this.alterarResponsavelChamado(input, user, 'atribuir_chamado', 'ATRIBUICAO', 'Responsavel alterado.', 'Responsavel removido.');
  }

  async transferirChamado(input: AtribuirChamadoInput, user: JwtPayload): Promise<string> {
    return this.alterarResponsavelChamado(input, user, 'transferir_chamado', 'TRANSFERENCIA', 'Chamado transferido.', 'Transferencia removida.');
  }

  private async alterarResponsavelChamado(
    input: AtribuirChamadoInput,
    user: JwtPayload,
    requiredAction: string,
    evento: string,
    observacaoAlteracao: string,
    observacaoRemocao: string
  ): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, requiredAction);

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const responsavelId = input.responsavelId?.trim() || null;
    const responsavelGrupoId = input.responsavelGrupoId ? Number(input.responsavelGrupoId) : null;

    if (responsavelId && responsavelGrupoId) {
      throw new BadRequestException('Selecione apenas um responsavel para o chamado.');
    }

    let novoResponsavelUsuario: UsuarioResumoRecord | null = null;
    let novoResponsavelGrupo: GrupoResumoRecord | null = null;

    if (responsavelId) {
      novoResponsavelUsuario = await this.chamadoResponsavel.ensureUserBelongsToCompany(responsavelId, empresaId);
    }

    if (responsavelGrupoId) {
      await this.chamadoResponsavel.ensureGrupoElegivelResponsavel(responsavelGrupoId, empresaId);
      novoResponsavelGrupo = await this.chamadoResponsavel.ensureGrupoResponsavel(responsavelGrupoId);
    }

    const responsavelAnteriorNome = chamadoResponsavelLabel(chamado);
    const novoResponsavelNome = novoResponsavelUsuario
      ? usuarioLabel(novoResponsavelUsuario)
      : novoResponsavelGrupo?.nome ?? null;

    if (isTerminalStatus(chamado.status)) {
      throw new BadRequestException('Reabra o chamado antes de alterar o responsavel.');
    }

    const hasResponsavel = !!responsavelId || !!responsavelGrupoId;
    const nextStatus = hasResponsavel && ['ABERTO', 'EM_TRIAGEM'].includes(chamado.status)
      ? 'EM_ATENDIMENTO'
      : chamado.status;

    await this.chamadoHistory.updateChamadoWithHistory(
      chamado,
      user,
      {
        responsavelId,
        responsavelGrupoId,
        liderAtendimentoId: null,
        atendimentoAssumidoEm: null,
        status: nextStatus,
        versao: { increment: 1 }
      },
      [
        {
          evento,
          campo: 'responsavel',
          valorAnterior: responsavelAnteriorNome,
          valorNovo: novoResponsavelNome,
          observacao: hasResponsavel ? observacaoAlteracao : observacaoRemocao
        },
        ...(chamado.liderAtendimentoId
          ? [{
              evento: 'LIBERACAO_ATENDIMENTO',
              campo: 'liderAtendimento',
              valorAnterior: usuarioLabel(chamado.liderAtendimento),
              valorNovo: null,
              observacao: 'Lideranca temporaria liberada apos alteracao do responsavel.'
            }]
          : []),
        ...(nextStatus !== chamado.status
          ? [{
              evento: 'ALTERACAO_STATUS',
              campo: 'status',
              valorAnterior: chamado.status,
              valorNovo: nextStatus,
              observacao: 'Status ajustado apos atribuicao.'
            }]
          : [])
      ]
    );

    if (responsavelId) {
      await this.chamadoAcompanhante.desativarAcompanhantesDoChamado(chamado, user, [responsavelId], 'Responsavel removido da lista de acompanhantes.');
    }

    return chamado.id;
  }
}
