import { Injectable } from '@nestjs/common';
import { CreateGrupoUsuarioInput } from './dto/create-grupo-usuario.input';
import { GrupoUsuarioType } from './dto/grupo-usuario.type';
import { UpdateGrupoUsuarioInput } from './dto/update-grupo-usuario.input';
import { GrupoUsuarioBootstrapService } from './grupo-usuario-bootstrap.service';
import { GrupoUsuarioCatalogService } from './grupo-usuario-catalog.service';
import { GrupoUsuarioRecord } from './types/grupo-usuario-record.types';

@Injectable()
export class GruposUsuariosService {
  constructor(
    private readonly grupoUsuarioBootstrap: GrupoUsuarioBootstrapService,
    private readonly grupoUsuarioCatalog: GrupoUsuarioCatalogService
  ) {}

  async ensureInitialSetup(): Promise<void> {
    return this.grupoUsuarioBootstrap.ensureInitialSetup();
  }

  findAll(): Promise<GrupoUsuarioType[]> {
    return this.grupoUsuarioCatalog.findAll();
  }

  findById(id?: number | null): Promise<GrupoUsuarioType | null> {
    return this.grupoUsuarioCatalog.findById(id);
  }

  create(input: CreateGrupoUsuarioInput): Promise<GrupoUsuarioType> {
    return this.grupoUsuarioCatalog.create(input);
  }

  update(input: UpdateGrupoUsuarioInput): Promise<GrupoUsuarioType> {
    return this.grupoUsuarioCatalog.update(input);
  }

  remove(id: number): Promise<boolean> {
    return this.grupoUsuarioCatalog.remove(id);
  }

  toType(grupo: GrupoUsuarioRecord): Promise<GrupoUsuarioType> {
    return this.grupoUsuarioCatalog.toType(grupo);
  }
}