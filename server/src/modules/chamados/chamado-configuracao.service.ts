import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from '../solucoes/solucoes.service';
import { ChamadoCategoriaConfigService } from './chamado-categoria-config.service';
import { ChamadoPrioridadeConfigService } from './chamado-prioridade-config.service';
import { ChamadoTipoConfigService } from './chamado-tipo-config.service';
import { CreateChamadoCategoriaInput, UpdateChamadoCategoriaInput } from './dto/chamado-categoria.input';
import { ChamadoCategoriaType } from './dto/chamado-categoria.type';
import { CreateChamadoPrioridadeInput, UpdateChamadoPrioridadeInput } from './dto/chamado-prioridade.input';
import { ChamadoPrioridadeType } from './dto/chamado-prioridade.type';
import { CreateChamadoTipoInput, UpdateChamadoTipoInput } from './dto/chamado-tipo.input';
import { ChamadoTipoType } from './dto/chamado-tipo.type';
import { ChamadoCategoriaRecord, ChamadoConfiguracaoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoConfiguracaoService {
  constructor(
    private readonly solucoesService: SolucoesService,
    private readonly categoriaConfig: ChamadoCategoriaConfigService,
    private readonly tipoConfig: ChamadoTipoConfigService,
    private readonly prioridadeConfig: ChamadoPrioridadeConfigService
  ) {}

  categoriasChamado(user: JwtPayload, ativas = true): Promise<ChamadoCategoriaType[]> {
    return this.categoriaConfig.categoriasChamado(user, ativas);
  }

  createCategoria(input: CreateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    return this.categoriaConfig.createCategoria(input, user);
  }

  updateCategoria(input: UpdateChamadoCategoriaInput, user: JwtPayload): Promise<ChamadoCategoriaType> {
    return this.categoriaConfig.updateCategoria(input, user);
  }

  deleteCategoria(id: number, user: JwtPayload): Promise<boolean> {
    return this.categoriaConfig.deleteCategoria(id, user);
  }

  async tiposChamado(user: JwtPayload, ativas = true): Promise<ChamadoTipoType[]> {
    const empresaId = user.empresaId;
    if (empresaId) {
      await this.ensureDefaultChamadoConfiguracoes(empresaId);
    }

    return this.tipoConfig.tiposChamado(user, ativas);
  }

  createTipo(input: CreateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    return this.tipoConfig.createTipo(input, user);
  }

  updateTipo(input: UpdateChamadoTipoInput, user: JwtPayload): Promise<ChamadoTipoType> {
    return this.tipoConfig.updateTipo(input, user);
  }

  deleteTipo(id: number, user: JwtPayload): Promise<boolean> {
    return this.tipoConfig.deleteTipo(id, user);
  }

  async prioridadesChamado(user: JwtPayload, ativas = true): Promise<ChamadoPrioridadeType[]> {
    const empresaId = user.empresaId;
    if (empresaId) {
      await this.ensureDefaultChamadoConfiguracoes(empresaId);
    }

    return this.prioridadeConfig.prioridadesChamado(user, ativas);
  }

  createPrioridade(input: CreateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    return this.prioridadeConfig.createPrioridade(input, user);
  }

  updatePrioridade(input: UpdateChamadoPrioridadeInput, user: JwtPayload): Promise<ChamadoPrioridadeType> {
    return this.prioridadeConfig.updatePrioridade(input, user);
  }

  deletePrioridade(id: number, user: JwtPayload): Promise<boolean> {
    return this.prioridadeConfig.deletePrioridade(id, user);
  }

  async ensureDefaultChamadoConfiguracoes(empresaId: number): Promise<void> {
    await this.solucoesService.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId, true);
  }

  ensureTipoChamado(empresaId: number, id: number | null | undefined): Promise<ChamadoConfiguracaoRecord> {
    return this.tipoConfig.ensureTipoChamado(empresaId, id);
  }

  ensurePrioridadeChamado(empresaId: number, id: number | null | undefined): Promise<ChamadoConfiguracaoRecord> {
    return this.prioridadeConfig.ensurePrioridadeChamado(empresaId, id);
  }

  ensureCategoria(id: number, empresaId: number, requireActive: boolean): Promise<ChamadoCategoriaRecord> {
    return this.categoriaConfig.ensureCategoria(id, empresaId, requireActive);
  }
}