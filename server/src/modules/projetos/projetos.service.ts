import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { AtualizarCicloProjetoInput } from './dto/atualizar-ciclo-projeto.input';
import { CreateProjetoInput } from './dto/create-projeto.input';
import { ProjetoFiltroInput } from './dto/projeto-filtro.input';
import { ProjetoPageType, ProjetoType, ProjetoUsuarioType } from './dto/projeto.type';
import { UpdateProjetoInput } from './dto/update-projeto.input';
import { UpdateProjetoEquipeInput } from './dto/update-projeto-equipe.input';
import { ProjetoCatalogService } from './projeto-catalog.service';
import { ProjetoEquipeService } from './projeto-equipe.service';
import { ProjetoLifecycleService } from './projeto-lifecycle.service';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoKeyService } from './projeto-key.service';
import { ProjetoQueryService } from './projeto-query.service';

@Injectable()
export class ProjetosService {
  constructor(
    private readonly authorization: ProjetoAuthorizationService,
    private readonly catalogService: ProjetoCatalogService,
    private readonly equipeService: ProjetoEquipeService,
    private readonly lifecycleService: ProjetoLifecycleService,
    private readonly keyService: ProjetoKeyService,
    private readonly queryService: ProjetoQueryService
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
}
