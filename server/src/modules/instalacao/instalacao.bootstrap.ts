import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InstalacaoService } from './instalacao.service';

@Injectable()
export class InstalacaoBootstrap implements OnApplicationBootstrap {
  constructor(private readonly instalacao: InstalacaoService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.instalacao.verificarSubida();
  }
}
