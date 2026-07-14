import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ChamadoSlaService } from './chamado-sla.service';

@Injectable()
export class ChamadoSlaJobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChamadoSlaJobService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly chamadoSla: ChamadoSlaService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.executar().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error('Falha ao atualizar status de SLA dos chamados.', message);
      });
    }, 60_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  executar(referenciaEm: Date = new Date()): Promise<number> {
    return this.chamadoSla.refreshOpenSlaStatuses(referenciaEm);
  }
}