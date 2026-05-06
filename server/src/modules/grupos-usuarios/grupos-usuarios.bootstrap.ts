import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { GruposUsuariosService } from './grupos-usuarios.service';

@Injectable()
export class GruposUsuariosBootstrap implements OnApplicationBootstrap {
  constructor(private readonly gruposUsuariosService: GruposUsuariosService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.gruposUsuariosService.ensureInitialSetup();
  }
}
