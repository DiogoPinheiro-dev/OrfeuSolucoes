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
import {
  AlterarEscopoProjetoSprintInput,
  ConcluirProjetoSprintInput,
  CreateProjetoSprintInput,
  TransicionarProjetoSprintInput,
  UpdateProjetoSprintInput
} from './dto/projeto-sprint.input';
import {
  ProjetoSprintPainelType,
  ProjetoSprintType
} from './dto/projeto-sprint.type';
import { ProjetoCatalogService } from './projeto-catalog.service';
import { ProjetoEquipeService } from './projeto-equipe.service';
import { ProjetoLifecycleService } from './projeto-lifecycle.service';
import { ProjetoAuthorizationService } from './projeto-authorization.service';
import { ProjetoKeyService } from './projeto-key.service';
import { ProjetoItemCatalogService } from './projeto-item-catalog.service';
import { ProjetoItemQueryService } from './projeto-item-query.service';
import { ProjetoQueryService } from './projeto-query.service';
import { ProjetoSprintService } from './projeto-sprint.service';
import {
  CreateProjetoEntregaInput,
  CreateProjetoMarcoInput,
  UpdateProjetoEntregaInput,
  UpdateProjetoMarcoInput,
  VersionarProjetoCompromissoInput
} from './dto/projeto-marco-entrega.input';
import {
  ProjetoEntregaType,
  ProjetoMarcoEntregaPainelType,
  ProjetoMarcoType
} from './dto/projeto-marco-entrega.type';
import { ProjetoMarcoEntregaService } from './projeto-marco-entrega.service';
import {
  CreateProjetoItemDependenciaInput,
  ProjetoCronogramaFiltroInput,
  UpdateProjetoCronogramaItemDatasInput,
  VersionarProjetoItemDependenciaInput
} from './dto/projeto-cronograma.input';
import {
  ProjetoCronogramaElementoType,
  ProjetoCronogramaPainelType,
  ProjetoItemDependenciaType
} from './dto/projeto-cronograma.type';
import { ProjetoCronogramaService } from './projeto-cronograma.service';
import { CreateProjetoAtualizacaoInput, CreateProjetoComentarioInput, ExcluirProjetoComentarioInput, ProjetoComunicacaoFeedFiltroInput, UpdateProjetoAtualizacaoInput, UpdateProjetoComentarioInput } from './dto/projeto-comunicacao.input';
import { ProjetoAtualizacaoType, ProjetoComentarioType, ProjetoComunicacaoPainelType, ProjetoComunicacaoProjetoType } from './dto/projeto-comunicacao.type';
import { ProjetoComunicacaoService } from './projeto-comunicacao.service';
import { AprovarProjetoOrcamentoInput, ExcluirProjetoOrcamentoItemInput, SalvarProjetoCustoInput, SalvarProjetoOrcamentoCategoriaInput, SalvarProjetoOrcamentoInput } from './dto/projeto-orcamento.input';
import { ExcluirProjetoRecursoInput, SalvarProjetoRecursoInput } from './dto/projeto-recurso.input';
import { ExcluirProjetoTarefaInput, SalvarProjetoTarefaInput } from './dto/projeto-tarefa.input';
import { ExcluirGradeItemInput, SalvarGradeAlocacaoInput, SalvarGradeCapacidadeInput, SalvarGradeVinculoInput } from './dto/projeto-grade-capacitacao.input';
import { ProjetoOrcamentoService } from './projeto-orcamento.service';
import { ProjetoRecursoService } from './projeto-recurso.service';
import { ProjetoTarefaService } from './projeto-tarefa.service';
import { ProjetoGradeCapacitacaoService } from './projeto-grade-capacitacao.service';
import { ProjetoPlanejamentoRecursoService } from './projeto-planejamento-recurso.service';

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
    private readonly backlogService: ProjetoBacklogService,
    private readonly sprintService: ProjetoSprintService,
    private readonly marcoEntregaService: ProjetoMarcoEntregaService,
    private readonly cronogramaService: ProjetoCronogramaService,
    private readonly comunicacaoService: ProjetoComunicacaoService,
    private readonly recursoService: ProjetoRecursoService,
    private readonly tarefaService: ProjetoTarefaService,
    private readonly gradeCapacitacaoService: ProjetoGradeCapacitacaoService,
    private readonly planejamentoRecursoService: ProjetoPlanejamentoRecursoService,
    private readonly orcamentoService: ProjetoOrcamentoService
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

  sprints(
    projetoId: string,
    user: JwtPayload
  ): Promise<ProjetoSprintPainelType> {
    return this.sprintService.painel(projetoId, user);
  }

  createSprint(
    input: CreateProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.create(input, user);
  }

  updateSprint(
    input: UpdateProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.update(input, user);
  }

  adicionarItemSprint(
    input: AlterarEscopoProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.adicionarItem(input, user);
  }

  removerItemSprint(
    input: AlterarEscopoProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.removerItem(input, user);
  }

  iniciarSprint(
    input: TransicionarProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.iniciar(input, user);
  }

  concluirSprint(
    input: ConcluirProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.concluir(input, user);
  }

  cancelarSprint(
    input: TransicionarProjetoSprintInput,
    user: JwtPayload
  ): Promise<ProjetoSprintType> {
    return this.sprintService.cancelar(input, user);
  }
  marcosEntregas(projetoId: string, incluirArquivados: boolean, user: JwtPayload): Promise<ProjetoMarcoEntregaPainelType> {
    return this.marcoEntregaService.painel(projetoId, incluirArquivados, user);
  }

  createMarco(input: CreateProjetoMarcoInput, user: JwtPayload): Promise<ProjetoMarcoType> {
    return this.marcoEntregaService.createMarco(input, user);
  }

  updateMarco(input: UpdateProjetoMarcoInput, user: JwtPayload): Promise<ProjetoMarcoType> {
    return this.marcoEntregaService.updateMarco(input, user);
  }

  createEntrega(input: CreateProjetoEntregaInput, user: JwtPayload): Promise<ProjetoEntregaType> {
    return this.marcoEntregaService.createEntrega(input, user);
  }

  updateEntrega(input: UpdateProjetoEntregaInput, user: JwtPayload): Promise<ProjetoEntregaType> {
    return this.marcoEntregaService.updateEntrega(input, user);
  }

  arquivarCompromisso(kind: 'MARCO' | 'ENTREGA', input: VersionarProjetoCompromissoInput, user: JwtPayload, reactivate: boolean) {
    return this.marcoEntregaService.archive(kind, input, user, reactivate);
  }

  cronograma(
    filtro: ProjetoCronogramaFiltroInput,
    user: JwtPayload
  ): Promise<ProjetoCronogramaPainelType> {
    return this.cronogramaService.painel(filtro, user);
  }

  createDependencia(
    input: CreateProjetoItemDependenciaInput,
    user: JwtPayload
  ): Promise<ProjetoItemDependenciaType> {
    return this.cronogramaService.createDependencia(input, user);
  }

  archiveDependencia(
    input: VersionarProjetoItemDependenciaInput,
    user: JwtPayload,
    reactivate: boolean
  ): Promise<ProjetoItemDependenciaType> {
    return this.cronogramaService.archiveDependencia(input, user, reactivate);
  }

  updateCronogramaItemDatas(
    input: UpdateProjetoCronogramaItemDatasInput,
    user: JwtPayload
  ): Promise<ProjetoCronogramaElementoType> {
    return this.cronogramaService.updateItemDates(input, user);
  }
  comunicacaoProjetos(user: JwtPayload): Promise<ProjetoComunicacaoProjetoType[]> {
    return this.comunicacaoService.projetos(user);
  }
  comunicacao(
    projetoId: string,
    user: JwtPayload,
    feed?: ProjetoComunicacaoFeedFiltroInput
  ): Promise<ProjetoComunicacaoPainelType> {
    return this.comunicacaoService.painel(projetoId, user, feed);
  }

  createAtualizacao(input: CreateProjetoAtualizacaoInput, user: JwtPayload): Promise<ProjetoAtualizacaoType> {
    return this.comunicacaoService.createAtualizacao(input, user);
  }

  updateAtualizacao(input: UpdateProjetoAtualizacaoInput, user: JwtPayload): Promise<ProjetoAtualizacaoType> {
    return this.comunicacaoService.updateAtualizacao(input, user);
  }

  createComentario(input: CreateProjetoComentarioInput, user: JwtPayload): Promise<ProjetoComentarioType> {
    return this.comunicacaoService.createComentario(input, user);
  }

  updateComentario(input: UpdateProjetoComentarioInput, user: JwtPayload): Promise<ProjetoComentarioType> {
    return this.comunicacaoService.updateComentario(input, user);
  }

  excluirComentario(input: ExcluirProjetoComentarioInput, user: JwtPayload): Promise<ProjetoComentarioType> {
    return this.comunicacaoService.excluirComentario(input, user);
  }
  recursosProjetos(user: JwtPayload) { return this.recursoService.projetos(user); }
  recursos(user: JwtPayload) { return this.recursoService.painel(user); }
  salvarRecurso(input: SalvarProjetoRecursoInput, user: JwtPayload) { return this.recursoService.salvarRecurso(input, user); }
  excluirRecurso(input: ExcluirProjetoRecursoInput, user: JwtPayload) { return this.recursoService.excluirRecurso(input, user); }
  tarefas(user: JwtPayload) { return this.tarefaService.painel(user); }
  salvarTarefa(input: SalvarProjetoTarefaInput, user: JwtPayload) { return this.tarefaService.salvar(input, user); }
  excluirTarefa(input: ExcluirProjetoTarefaInput, user: JwtPayload) { return this.tarefaService.excluir(input, user); }
  gradeCapacitacao(user: JwtPayload) { return this.gradeCapacitacaoService.painel(user); }
  planejamentoRecursos(user: JwtPayload) { return this.planejamentoRecursoService.painel(user); }
  salvarGradeVinculo(input: SalvarGradeVinculoInput, user: JwtPayload) { return this.gradeCapacitacaoService.salvarVinculo(input, user); }
  salvarGradeCapacidade(input: SalvarGradeCapacidadeInput, user: JwtPayload) { return this.gradeCapacitacaoService.salvarCapacidade(input, user); }
  salvarGradeAlocacao(input: SalvarGradeAlocacaoInput, user: JwtPayload) { return this.gradeCapacitacaoService.salvarAlocacao(input, user); }
  excluirGradeCapacidade(input: ExcluirGradeItemInput, user: JwtPayload) { return this.gradeCapacitacaoService.excluirCapacidade(input, user); }
  excluirGradeAlocacao(input: ExcluirGradeItemInput, user: JwtPayload) { return this.gradeCapacitacaoService.excluirAlocacao(input, user); }
  orcamentoProjetos(user: JwtPayload) { return this.orcamentoService.projetos(user); }
  orcamento(projetoId: string, user: JwtPayload) { return this.orcamentoService.painel(projetoId, user); }
  salvarOrcamento(input: SalvarProjetoOrcamentoInput, user: JwtPayload) { return this.orcamentoService.salvarOrcamento(input, user); }
  salvarOrcamentoCategoria(input: SalvarProjetoOrcamentoCategoriaInput, user: JwtPayload) { return this.orcamentoService.salvarCategoria(input, user); }
  salvarCusto(input: SalvarProjetoCustoInput, user: JwtPayload) { return this.orcamentoService.salvarCusto(input, user); }
  excluirOrcamentoCategoria(input: ExcluirProjetoOrcamentoItemInput, user: JwtPayload) { return this.orcamentoService.excluirCategoria(input, user); }
  excluirCusto(input: ExcluirProjetoOrcamentoItemInput, user: JwtPayload) { return this.orcamentoService.excluirCusto(input, user); }
  aprovarOrcamento(input: AprovarProjetoOrcamentoInput, user: JwtPayload) { return this.orcamentoService.aprovar(input, user); }
  reabrirOrcamento(input: AprovarProjetoOrcamentoInput, user: JwtPayload) { return this.orcamentoService.reabrir(input, user); }
}
