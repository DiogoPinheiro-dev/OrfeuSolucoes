import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ChamadoAberturaService } from './chamado-abertura.service';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAnexoService } from './chamado-anexo.service';
import { ChamadoAtendimentoService } from './chamado-atendimento.service';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoCategoriaConfigService } from './chamado-categoria-config.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { ChamadoMensagemService } from './chamado-mensagem.service';
import { ChamadoPrioridadeConfigService } from './chamado-prioridade-config.service';
import { ChamadoPrioridadeService } from './chamado-prioridade.service';
import { ChamadoResponsavelElegibilidadeService } from './chamado-responsavel-elegibilidade.service';
import { ChamadoResponsavelOptionsService } from './chamado-responsavel-options.service';
import { ChamadoResponsavelVinculoService } from './chamado-responsavel-vinculo.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { ChamadoStatusService } from './chamado-status.service';
import { ChamadoTipoConfigService } from './chamado-tipo-config.service';
import { ChamadosController } from './chamados.controller';
import { ChamadosResolver } from './chamados.resolver';
import { ChamadosService } from './chamados.service';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  controllers: [ChamadosController],
  providers: [ChamadosService, ChamadosResolver, ChamadoAnexoStorageService, ChamadoAberturaService, ChamadoAnexoService, ChamadoAtendimentoService, ChamadoQueryService, ChamadoAuthorizationService, ChamadoCategoriaConfigService, ChamadoConfiguracaoService, ChamadoPrioridadeConfigService, ChamadoTipoConfigService, ChamadoHistoryService, ChamadoMensagemService, ChamadoPrioridadeService, ChamadoResponsavelElegibilidadeService, ChamadoResponsavelOptionsService, ChamadoResponsavelVinculoService, ChamadoResponsavelService, ChamadoStatusService, ChamadoAcompanhanteService],
  exports: [ChamadosService]
})
export class ChamadosModule {}
