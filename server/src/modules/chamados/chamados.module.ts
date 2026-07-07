import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SolucoesModule } from '../solucoes/solucoes.module';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAnexoService } from './chamado-anexo.service';
import { ChamadoAtendimentoService } from './chamado-atendimento.service';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { ChamadoMensagemService } from './chamado-mensagem.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { ChamadoStatusService } from './chamado-status.service';
import { ChamadosController } from './chamados.controller';
import { ChamadosResolver } from './chamados.resolver';
import { ChamadosService } from './chamados.service';
import { ChamadoQueryService } from './queries/chamado-query.service';

@Module({
  imports: [PrismaModule, SolucoesModule],
  controllers: [ChamadosController],
  providers: [ChamadosService, ChamadosResolver, ChamadoAnexoStorageService, ChamadoAnexoService, ChamadoAtendimentoService, ChamadoQueryService, ChamadoAuthorizationService, ChamadoConfiguracaoService, ChamadoHistoryService, ChamadoMensagemService, ChamadoResponsavelService, ChamadoStatusService, ChamadoAcompanhanteService],
  exports: [ChamadosService]
})
export class ChamadosModule {}
