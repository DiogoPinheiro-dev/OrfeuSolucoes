import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ChamadoAberturaService } from './chamado-abertura.service';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAnexoService } from './chamado-anexo.service';
import { ChamadoAtendimentoService } from './chamado-atendimento.service';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoCategoriaService } from './chamado-categoria.service';
import { ChamadoCategoriaConfigService } from './chamado-categoria-config.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoDashboardService } from './chamado-dashboard.service';
import { ChamadoGoogleEmailController } from './chamado-google-email.controller';
import { ChamadoGoogleEmailService } from './chamado-google-email.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { ChamadoRelatorioService } from './chamado-relatorio.service';
import { ChamadoMensagemService } from './chamado-mensagem.service';
import { ChamadoNotificacaoService } from './chamado-notificacao.service';
import { ChamadoPrioridadeConfigService } from './chamado-prioridade-config.service';
import { ChamadoPrioridadeService } from './chamado-prioridade.service';
import { ChamadoResponsavelElegibilidadeService } from './chamado-responsavel-elegibilidade.service';
import { ChamadoResponsavelOptionsService } from './chamado-responsavel-options.service';
import { ChamadoResponsavelVinculoService } from './chamado-responsavel-vinculo.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { ChamadoSlaConfigService } from './chamado-sla-config.service';
import { ChamadoSlaJobService } from './chamado-sla-job.service';
import { ChamadoSlaService } from './chamado-sla.service';
import { ChamadoStatusService } from './chamado-status.service';
import { ChamadoTipoConfigService } from './chamado-tipo-config.service';
import { ChamadosController } from './chamados.controller';
import { ChamadosResolver } from './chamados.resolver';
import { ChamadosService } from './chamados.service';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  controllers: [ChamadosController, ChamadoGoogleEmailController],
  providers: [ChamadosService, ChamadosResolver, ChamadoDashboardService, ChamadoRelatorioService, ChamadoAnexoStorageService, ChamadoAberturaService, ChamadoAnexoService, ChamadoAtendimentoService, ChamadoQueryService, ChamadoAuthorizationService, ChamadoCategoriaService, ChamadoCategoriaConfigService, ChamadoConfiguracaoService, ChamadoGoogleEmailService, ChamadoPrioridadeConfigService, ChamadoTipoConfigService, ChamadoHistoryService, ChamadoMensagemService, ChamadoNotificacaoService, ChamadoPrioridadeService, ChamadoResponsavelElegibilidadeService, ChamadoResponsavelOptionsService, ChamadoResponsavelVinculoService, ChamadoResponsavelService, ChamadoSlaConfigService, ChamadoSlaJobService, ChamadoSlaService, ChamadoStatusService, ChamadoAcompanhanteService],
  exports: [ChamadosService]
})
export class ChamadosModule {}
