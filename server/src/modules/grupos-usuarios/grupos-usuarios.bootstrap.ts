import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { GrupoUsuarioBootstrapService } from './grupo-usuario-bootstrap.service';

@Injectable()
export class GruposUsuariosBootstrap implements OnApplicationBootstrap {
  constructor(private readonly grupoUsuarioBootstrap: GrupoUsuarioBootstrapService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.grupoUsuarioBootstrap.ensureInitialSetup();
  }
}