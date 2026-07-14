import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { FEATURES } from './constants/chamado.constants';
import { AlterarPrioridadeChamadoInput } from './dto/alterar-prioridade-chamado.input';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { ChamadoSlaService } from './chamado-sla.service';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Injectable()
export class ChamadoPrioridadeService {
  constructor(
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly chamadoConfiguracao: ChamadoConfiguracaoService,
    private readonly chamadoHistory: ChamadoHistoryService,
    private readonly chamadoSla: ChamadoSlaService
  ) {}

  async alterarPrioridadeChamado(input: AlterarPrioridadeChamadoInput, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'alterar_prioridade');

    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const prioridade = await this.chamadoConfiguracao.ensurePrioridadeChamado(empresaId, input.prioridadeId);

    if (prioridade.id === chamado.prioridadeId) {
      return chamado.id;
    }

    const slaData = await this.chamadoSla.buildPriorityChangeSnapshot(chamado, prioridade.id);

    await this.chamadoHistory.updateChamadoWithHistory(
      chamado,
      user,
      {
        prioridadeId: prioridade.id,
        ...slaData,
        versao: { increment: 1 }
      },
      [{
        evento: 'ALTERACAO_PRIORIDADE',
        campo: 'prioridade',
        valorAnterior: chamado.prioridadeConfiguracao?.nome ?? null,
        valorNovo: prioridade.nome
      }]
    );

    return chamado.id;
  }
}
