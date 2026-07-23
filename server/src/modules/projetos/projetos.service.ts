import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AtualizarCicloProjetoInput } from './dto/atualizar-ciclo-projeto.input';
import {
  AlterarStatusProjetoItemInput,
  VersionarProjetoItemInput
} from './dto/alterar-status-projeto-item.input';
import { CreateProjetoInput } from './dto/create-projeto.input';
import { MoverProjetoItemBacklogInput } from './dto/mover-projeto-item-backlog.input';
import {
  ProjetoBacklogMovimentoType,
  ProjetoBacklogProjetoType
} from './dto/projeto-backlog.type';
import { CreateProjetoItemInput } from './dto/create-projeto-item.input';
import { ProjetoItemFiltroInput } from './dto/projeto-item-filtro.input';
import { ProjetoItemHistoricoType } from './dto/projeto-item-historico.type';
import { ProjetoItemPageType, ProjetoItemType } from './dto/projeto-item.type';
import { ProjetoFiltroInput } from './dto/projeto-filtro.input';
import { ProjetoPageType, ProjetoType, ProjetoUsuarioType } from './dto/projeto.type';
import { UpdateProjetoInput } from './dto/update-projeto.input';
import { UpdateProjetoItemInput } from './dto/update-projeto-item.input';
import { UpdateProjetoEquipeInput } from './dto/update-projeto-equipe.input';
import { ProjetoBacklogService } from './projeto-backlog.service';
import { ProjetoCatalogService } from './projeto-catalog.service';
import { ProjetoEquipeService } from './projeto-equipe.service';
import { ProjetoLifecycleService } from './projeto-lifecycle.service';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoKeyService } from './projeto-key.service';
import { ProjetoItemCatalogService } from './projeto-item-catalog.service';
import { ProjetoItemQueryService } from './projeto-item-query.service';
import { ProjetoQueryService } from './projeto-query.service';

@Injectable()
export class ProjetosService {
  constructor(
    private readonly authorization: ProjetoAuthorizationService,
    private readonly catalogService: ProjetoCatalogService,
    private readonly equipeService: ProjetoEquipeService,
    private readonly lifecycleService: ProjetoLifecycleService,
    private readonly keyService: ProjetoKeyService,
    private readonly queryService: ProjetoQueryService,
    private readonly itemCatalogService: ProjetoItemCatalogService,
    private readonly itemQueryService: ProjetoItemQueryService,
    private readonly backlogService: ProjetoBacklogService
  ) {}

  create(input: CreateProjetoInput, user: JwtPayload): Promise<ProjetoType> {
    return this.catalogService.create(input, user);
  }

  update(input: UpdateProjetoInput, user: JwtPayload): Promise<ProjetoType> {
    return this.catalogService.update(input, user);
  }
  updateEquipe(input: UpdateProjetoEquipeInput, user: JwtPayload): Promise<ProjetoType> {
    return this.equipeService.updateEquipe(input, user);
  }

  atualizarCiclo(input: AtualizarCicloProjetoInput, user: JwtPayload): Promise<ProjetoType> {
    return this.lifecycleService.atualizarCiclo(input, user);
  }

  arquivar(id: string, user: JwtPayload): Promise<ProjetoType> {
    return this.lifecycleService.arquivar(id, user);
  }

  reativar(id: string, user: JwtPayload): Promise<ProjetoType> {
    return this.lifecycleService.reativar(id, user);
  }
  async sugerirChave(nome: string, user: JwtPayload): Promise<string> {
    const empresaId = await this.authorization.assertReadAccess(user);
    return this.keyService.sugerir(nome, empresaId);
  }

  projetos(user: JwtPayload, filtro?: ProjetoFiltroInput): Promise<ProjetoPageType> {
    return this.queryService.findPage(user, filtro);
  }

  projeto(id: string, user: JwtPayload): Promise<ProjetoType> {
    return this.queryService.findOne(id, user);
  }

  participantesDisponiveis(user: JwtPayload): Promise<ProjetoUsuarioType[]> {
    return this.queryService.participantesDisponiveis(user);
  }

  createItem(
    input: CreateProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.itemCatalogService.create(input, user);
  }

  updateItem(
    input: UpdateProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.itemCatalogService.update(input, user);
  }

  alterarStatusItem(
    input: AlterarStatusProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.itemCatalogService.alterarStatus(input, user);
  }

  arquivarItem(
    input: VersionarProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.itemCatalogService.arquivar(input, user);
  }

  reativarItem(
    input: VersionarProjetoItemInput,
    user: JwtPayload
  ): Promise<ProjetoItemType> {
    return this.itemCatalogService.reativar(input, user);
  }

  itens(
    user: JwtPayload,
    filtro: ProjetoItemFiltroInput
  ): Promise<ProjetoItemPageType> {
    return this.itemQueryService.findPage(user, filtro);
  }

  item(id: string, user: JwtPayload): Promise<ProjetoItemType> {
    return this.itemQueryService.findOne(id, user);
  }

  itemHistorico(
    id: string,
    user: JwtPayload
  ): Promise<ProjetoItemHistoricoType[]> {
    return this.itemQueryService.findHistorico(id, user);
  }

  backlogProjetos(
    user: JwtPayload,
    incluirArquivados = false
  ): Promise<ProjetoBacklogProjetoType[]> {
    return this.backlogService.projetos(user, incluirArquivados);
  }

  backlogResponsaveis(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoUsuarioType[]> {
    return this.backlogService.responsaveis(projetoId, user);
  }

  moverItemBacklog(
    input: MoverProjetoItemBacklogInput,
    user: JwtPayload
  ): Promise<ProjetoBacklogMovimentoType> {
    return this.backlogService.mover(input, user);
  }
}
