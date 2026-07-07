import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { FEATURES, STATUS } from './constants/chamado.constants';
import { AlterarStatusChamadoInput } from './dto/alterar-status-chamado.input';
import { assertStatusTransition, isClosedStatus, isTerminalStatus } from './policies/chamado-status.policy';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Injectable()
export class ChamadoStatusService {
  constructor(
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoHistory: ChamadoHistoryService
  ) {}

  async alterarStatusChamado(input: AlterarStatusChamadoInput, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'alterar_status');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const status = this.normalizeValue(input.status, STATUS, undefined, 'status');

    if (isTerminalStatus(status)) {
      throw new BadRequestException('Use as acoes especificas para resolver, encerrar ou arquivar chamados.');
    }

    assertStatusTransition(chamado.status, status);

    await this.chamadoHistory.updateStatus(chamado, user, status, input.observacao ?? null);

    return chamado.id;
  }

  async resolverChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'resolver_chamado');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamado arquivado nao pode ser resolvido novamente.');
    }

    if (chamado.status !== 'RESOLVIDO') {
      await this.chamadoHistory.updateStatus(chamado, user, 'RESOLVIDO', observacao ?? null, {
        resolvidoEm: new Date(),
        liderAtendimentoId: null,
        atendimentoAssumidoEm: null
      });
    }

    return chamado.id;
  }

  async encerrarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'encerrar_chamado');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.authorization.assertUsuarioResponsavelPeloChamado(user, chamado);

    if (chamado.status !== 'RESOLVIDO') {
      throw new BadRequestException('Apenas chamados resolvidos podem ser arquivados.');
    }

    await this.chamadoHistory.updateStatus(chamado, user, 'ARQUIVADO', observacao ?? null, {
      encerradoEm: new Date(),
      liderAtendimentoId: null,
      atendimentoAssumidoEm: null
    });

    return chamado.id;
  }

  async arquivarChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.authorization.assertCanArchiveChamado(user, chamado);

    if (chamado.status === 'ARQUIVADO') {
      return chamado.id;
    }

    await this.chamadoHistory.updateStatus(chamado, user, 'ARQUIVADO', observacao ?? 'Chamado arquivado.', {
      encerradoEm: chamado.encerradoEm ?? new Date(),
      liderAtendimentoId: null,
      atendimentoAssumidoEm: null
    });

    return chamado.id;
  }

  async reabrirChamado(chamadoId: string, user: JwtPayload, observacao?: string | null): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    if (isClosedStatus(chamado.status)) {
      this.authorization.assertCanUnarchiveChamado(user);
      await this.authorization.assertFeatureAction(user, FEATURES.arquivados, 'reabrir_chamado');
    } else if (chamado.solicitanteId === user.sub && chamado.status === 'RESOLVIDO') {
      await this.authorization.assertFeatureAction(user, FEATURES.meus, 'reabrir_proprio_chamado');
    } else {
      await this.authorization.assertFeatureAction(user, FEATURES.painel, 'reabrir_chamado');
    }

    if (!isTerminalStatus(chamado.status)) {
      throw new BadRequestException('Apenas chamados resolvidos ou arquivados podem ser reabertos.');
    }

    await this.chamadoHistory.updateChamadoWithHistory(
      chamado,
      user,
      {
        status: 'EM_ATENDIMENTO',
        resolvidoEm: null,
        encerradoEm: null,
        versao: { increment: 1 }
      },
      [{
        evento: 'REABERTURA',
        campo: 'status',
        valorAnterior: chamado.status,
        valorNovo: 'EM_ATENDIMENTO',
        observacao: observacao?.trim() || 'Chamado reaberto.'
      }]
    );

    return chamado.id;
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
