import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateFuncionalidadeInput } from './dto/create-funcionalidade.input';
import { CreateSolucaoInput } from './dto/create-solucao.input';
import { FuncionalidadeType } from './dto/funcionalidade.type';
import { SolucaoType } from './dto/solucao.type';
import { UpdateFuncionalidadeInput } from './dto/update-funcionalidade.input';
import { UpdateSolucaoInput } from './dto/update-solucao.input';
import { HubNavigationService } from './hub-navigation.service';
import { SolucaoAcessoService } from './solucao-acesso.service';
import { SolucaoBootstrapService } from './solucao-bootstrap.service';
import { SolucaoCatalogService } from './solucao-catalog.service';
import { SolucaoQueryService } from './solucao-query.service';
import { FuncionalidadePermissao } from './types/permissao.types';
export type { FuncionalidadeAcaoPermissao, FuncionalidadePermissao } from './types/permissao.types';

@Injectable()
export class SolucoesService {
  constructor(
    private readonly solucaoAcessoService: SolucaoAcessoService,
    private readonly solucaoBootstrapService: SolucaoBootstrapService,
    private readonly solucaoCatalogService: SolucaoCatalogService,
    private readonly hubNavigationService: HubNavigationService,
    private readonly solucaoQueryService: SolucaoQueryService
  ) {}

  async ensureDefaultChamadoConfiguracoesForEmpresa(empresaId: number, force = false): Promise<void> {
    return this.solucaoBootstrapService.ensureDefaultChamadoConfiguracoesForEmpresa(empresaId, force);
  }

  async ensureDefaultConfiguradorFeatures(): Promise<void> {
    return this.solucaoBootstrapService.ensureDefaultConfiguradorFeatures();
  }

  async ensureControleChamadosSolution(): Promise<void> {
    return this.solucaoBootstrapService.ensureControleChamadosSolution();
  }
  async ensureProjetosSolution(): Promise<void> {
    return this.solucaoBootstrapService.ensureProjetosSolution();
  }


  async myHubNavigation(user: JwtPayload): Promise<SolucaoType[]> {
    return this.hubNavigationService.myHubNavigation(user);
  }

  async resolveAvailableSolutionSlugs(user: { login?: string | null; grupo?: { id?: number | null } | null }, empresaId?: number | null): Promise<string[]> {
    return this.hubNavigationService.resolveAvailableSolutionSlugs(user, empresaId);
  }

  async findAll(): Promise<SolucaoType[]> {
    return this.solucaoQueryService.findAll();
  }

  async create(input: CreateSolucaoInput): Promise<SolucaoType> {
    return this.solucaoCatalogService.create(input);
  }

  async update(input: UpdateSolucaoInput): Promise<SolucaoType> {
    return this.solucaoCatalogService.update(input);
  }

  async remove(id: number): Promise<boolean> {
    return this.solucaoCatalogService.remove(id);
  }

  async createFuncionalidade(input: CreateFuncionalidadeInput): Promise<FuncionalidadeType> {
    return this.solucaoCatalogService.createFuncionalidade(input);
  }

  async updateFuncionalidade(input: UpdateFuncionalidadeInput): Promise<FuncionalidadeType> {
    return this.solucaoCatalogService.updateFuncionalidade(input);
  }

  async removeFuncionalidade(id: number): Promise<boolean> {
    return this.solucaoCatalogService.removeFuncionalidade(id);
  }

  async syncGroupAccess(
    grupoId: number,
    solucaoIds: number[] = [],
    funcionalidadeIds: number[] = [],
    funcionalidadePermissoes: FuncionalidadePermissao[] = []
  ): Promise<void> {
    return this.solucaoAcessoService.syncGroupAccess(grupoId, solucaoIds, funcionalidadeIds, funcionalidadePermissoes);
  }

  async syncCompanyAccess(empresaId: number, solucaoIds: number[] = [], funcionalidadeIds: number[] = []): Promise<void> {
    return this.solucaoAcessoService.syncCompanyAccess(empresaId, solucaoIds, funcionalidadeIds);
  }

  async findGroupAccess(grupoId: number): Promise<{ solucaoIds: number[]; funcionalidadeIds: number[]; funcionalidadePermissoes: Required<FuncionalidadePermissao>[] }> {
    return this.solucaoAcessoService.findGroupAccess(grupoId);
  }

  async findCompanyAccess(empresaId: number): Promise<{ solucaoIds: number[]; funcionalidadeIds: number[] }> {
    return this.solucaoAcessoService.findCompanyAccess(empresaId);
  }

  async findCompanySolutionSummaries(empresaId: number): Promise<Array<{ id: number; slug: string; nome: string }>> {
    return this.solucaoAcessoService.findCompanySolutionSummaries(empresaId);
  }
}