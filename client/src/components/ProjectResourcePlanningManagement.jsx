import { useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  excluirPlanejamentoCapacidade,
  excluirPlanejamentoExecucao,
  excluirPlanejamentoTarefa,
  getPlanejamentoRecursos,
  salvarPlanejamentoCapacidade,
  salvarPlanejamentoExecucao,
  salvarPlanejamentoTarefa,
  salvarPlanejamentoVinculo
} from "../../services/Projetos/PlanejamentoRecursoService";
import { useCrudSelection } from "../hooks/useCrudSelection";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import "../styles/crudGrid.css";
import "../styles/projectResourcePlanning.css";

const emptyPanel = { recursos: [], projetos: [], linhas: [], tarefasPendentes: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";
const hours = (minutes) => `${(Number(minutes || 0) / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;
const dateLabel = (value) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)) : "—";
const dateTime = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const dateInput = (value) => value ? String(value).slice(0, 10) : "";
const currency = (value, moeda = "BRL") => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(Number(value || 0)); }
  catch { return `${moeda} ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`; }
};
const costLabel = (costs = []) => costs.length ? costs.map((item) => currency(item.valor, item.moeda)).join(" + ") : currency(0, "BRL");

export default function ProjectResourcePlanningManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [activeView, setActiveView] = useState("vinculos");
  const [selectedId, setSelectedId] = useState(null);
  const [taskViewId, setTaskViewId] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [linkEditor, setLinkEditor] = useState(null);
  const [viewState, setViewState] = useState(null);
  const [taskEditor, setTaskEditor] = useState(null);
  const [periodEditor, setPeriodEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const projects = useMemo(() => panel.projetos.slice().sort((a, b) => a.nome.localeCompare(b.nome)), [panel.projetos]);
  const resources = useMemo(() => panel.recursos.slice().sort((a, b) => userLabel(a.usuario).localeCompare(userLabel(b.usuario))), [panel.recursos]);
  const rows = useMemo(() => panel.linhas.filter((item) =>
    (!projectFilter || item.projetoId === projectFilter) &&
    (!resourceFilter || item.cadastroRecursoId === resourceFilter)
  ), [panel.linhas, projectFilter, resourceFilter]);
  const allTaskRows = useMemo(() => [
    ...panel.linhas.flatMap((line) => line.tarefas.map((task) => ({
      ...task,
      line,
      cadastroRecursoId: line.cadastroRecursoId,
      usuario: line.usuario,
      projeto: line.projeto
    }))),
    ...panel.tarefasPendentes.map((task) => ({
      ...task,
      line: null,
      cadastroRecursoId: task.recursoId,
      usuario: task.recurso?.usuario,
      projeto: null
    }))
  ].sort((a, b) => a.funcionalidade.localeCompare(b.funcionalidade)), [panel.linhas, panel.tarefasPendentes]);
  const taskRows = useMemo(() => {
    const search = taskSearch.trim().toLocaleLowerCase("pt-BR");
    return allTaskRows.filter((item) => {
      const status = item.pendenteVinculo ? "PENDENTE" : item.ativo ? "ATIVA" : "INATIVA";
      const searchable = `${item.funcionalidade} ${userLabel(item.usuario)} ${item.projeto?.chave || ""} ${item.projeto?.nome || ""}`.toLocaleLowerCase("pt-BR");
      return (!projectFilter || item.projeto?.id === projectFilter)
        && (!resourceFilter || item.cadastroRecursoId === resourceFilter)
        && (!taskStatusFilter || status === taskStatusFilter)
        && (!search || searchable.includes(search));
    });
  }, [allTaskRows, projectFilter, resourceFilter, taskSearch, taskStatusFilter]);
  const taskSelection = useCrudSelection(taskRows);
  const selectedLine = useMemo(() => panel.linhas.find((item) => item.id === selectedId) || null, [panel.linhas, selectedId]);
  const selectedTask = useMemo(() => allTaskRows.find((item) => item.id === taskSelection.selectedId) || null, [allTaskRows, taskSelection.selectedId]);
  const viewedTask = useMemo(() => allTaskRows.find((item) => item.id === taskViewId) || null, [allTaskRows, taskViewId]);
  const writableTaskLines = useMemo(() => panel.linhas.filter((line) => writable(line, true)), [panel.linhas]);
  const editorLine = useMemo(() => panel.linhas.find((item) => item.id === linkEditor?.id) || null, [panel.linhas, linkEditor?.id]);
  const viewLine = useMemo(() => panel.linhas.find((item) => item.id === viewState?.id) || null, [panel.linhas, viewState?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getPlanejamentoRecursos();
      setPanel(result || emptyPanel);
      setSelectedId((current) => result?.linhas?.some((item) => item.id === current) ? current : null);
    } catch (loadError) {
      setError(loadError.message);
      setPanel(emptyPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (selectedId && !rows.some((item) => item.id === selectedId)) setSelectedId(null);
  }, [rows, selectedId]);

  const run = async (operation, message, reset) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await operation();
      reset?.();
      setSuccess(message);
      await load();
    } catch (operationError) {
      setError(operationError.message);
    } finally {
      setSaving(false);
    }
  };

  const hasAvailableLink = useMemo(() => resources.some((resource) =>
    resource.ativo && projects.some((project) =>
      !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === resource.id && line.projetoId === project.id)
    )
  ), [panel.linhas, projects, resources]);

  const openLinkCreate = () => {
    const resource = resources.find((item) => item.ativo && projects.some((project) =>
      !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === item.id && line.projetoId === project.id)
    ));
    const project = projects.find((item) =>
      !item.arquivadoEm && resource && !panel.linhas.some((line) => line.cadastroRecursoId === resource.id && line.projetoId === item.id)
    );
    setLinkEditor({ mode: "create", activeTab: "cadastro", cadastroRecursoId: resource?.id || "", projetoId: project?.id || "", ativo: true });
  };
  const openLinkEdit = (line) => setLinkEditor({
    mode: "edit",
    activeTab: "cadastro",
    id: line.id,
    versao: line.versao,
    cadastroRecursoId: line.cadastroRecursoId,
    projetoId: line.projetoId,
    ativo: line.vinculoAtivo
  });
  const availableLinkProjects = useMemo(() => projects.filter((project) =>
    linkEditor?.mode === "edit"
      ? project.id === linkEditor.projetoId
      : !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === linkEditor?.cadastroRecursoId && line.projetoId === project.id)
  ), [linkEditor, panel.linhas, projects]);
  const submitLink = (event) => {
    event.preventDefault();
    const input = {
      cadastroRecursoId: linkEditor.cadastroRecursoId,
      projetoId: linkEditor.projetoId,
      ativo: linkEditor.ativo,
      ...(linkEditor.id ? { id: linkEditor.id, versao: linkEditor.versao } : {})
    };
    void run(
      () => salvarPlanejamentoVinculo(input),
      linkEditor.id ? "Vínculo do recurso alterado." : "Recurso vinculado ao projeto.",
      () => setLinkEditor(null)
    );
  };

  const openTask = (line, task = null, { allowLinkChange = false } = {}) => setTaskEditor({
    mode: task ? "edit" : "create",
    id: task?.id,
    versao: task?.versao,
    recursoId: task?.recursoId || line.cadastroRecursoId,
    projetoRecursoId: task?.projetoRecursoId || line.id,
    funcionalidade: task?.funcionalidade || "",
    estimativaHoras: task ? String(Number(task.estimativaMinutos) / 60) : "",
    valorHora: task ? String(Number(task.valorHora)) : "",
    moeda: task?.moeda || "BRL",
    observacao: task?.observacao || "",
    ativo: task?.ativo ?? true,
    pendente: false,
    lockLink: !!task || !allowLinkChange
  });
  const openPendingTask = (task) => {
    const line = panel.linhas.find((item) => item.cadastroRecursoId === task.recursoId && item.recursoAtivo && item.vinculoAtivo && !item.projeto.arquivadoEm);
    setTaskEditor({
      mode: "edit",
      id: task.id,
      versao: task.versao,
      recursoId: task.recursoId,
      projetoRecursoId: line?.id || "",
      funcionalidade: task.funcionalidade,
      estimativaHoras: String(Number(task.estimativaMinutos) / 60),
      valorHora: String(Number(task.valorHora)),
      moeda: task.moeda,
      observacao: task.observacao || "",
      ativo: task.ativo,
      pendente: true,
      lockLink: false
    });
  };
  const openTaskCreate = () => {
    const line = writableTaskLines.find((item) =>
      (!projectFilter || item.projetoId === projectFilter) && (!resourceFilter || item.cadastroRecursoId === resourceFilter)
    ) || writableTaskLines[0];
    if (line) openTask(line, null, { allowLinkChange: true });
  };
  const openTaskFromRow = (task) => {
    if (task.pendenteVinculo || !task.line) openPendingTask(task);
    else openTask(task.line, task);
  };

  const submitTask = (event) => {
    event.preventDefault();
    const input = {
      recursoId: taskEditor.recursoId,
      projetoRecursoId: taskEditor.projetoRecursoId,
      funcionalidade: taskEditor.funcionalidade.trim(),
      estimativaMinutos: Math.round(Number(taskEditor.estimativaHoras) * 60),
      valorHora: Number(taskEditor.valorHora).toFixed(4),
      moeda: taskEditor.moeda.trim().toUpperCase(),
      observacao: taskEditor.observacao.trim() || null,
      ativo: taskEditor.ativo,
      ...(taskEditor.id ? { id: taskEditor.id, versao: taskEditor.versao } : {})
    };
    void run(
      () => salvarPlanejamentoTarefa(input),
      taskEditor.pendente ? "Tarefa vinculada ao projeto." : taskEditor.id ? "Tarefa alterada." : "Tarefa cadastrada.",
      () => setTaskEditor(null)
    );
  };

  const openPeriod = (kind, line, item = null, viewOnly = false) => setPeriodEditor({
    kind,
    viewOnly,
    projetoId: line.projetoId,
    projetoRecursoId: line.id,
    id: item?.id,
    versao: item?.versao,
    tarefaId: kind === "EXECUCAO" ? item?.tarefaId || line.tarefas.find((task) => task.ativo)?.id || "" : "",
    inicioEm: dateInput(item?.inicioEm),
    fimEm: dateInput(item?.fimEm),
    horas: item ? String(Number(item[kind === "CAPACIDADE" ? "capacidadeMinutos" : "alocacaoMinutos"]) / 60) : ""
  });
  const submitPeriod = (event) => {
    event.preventDefault();
    const capacity = periodEditor.kind === "CAPACIDADE";
    const input = {
      projetoId: periodEditor.projetoId,
      projetoRecursoId: periodEditor.projetoRecursoId,
      inicioEm: periodEditor.inicioEm,
      fimEm: periodEditor.fimEm,
      ...(periodEditor.id ? { id: periodEditor.id, versao: periodEditor.versao } : {}),
      ...(capacity
        ? { capacidadeMinutos: Math.round(Number(periodEditor.horas) * 60) }
        : { tarefaId: periodEditor.tarefaId, alocacaoMinutos: Math.round(Number(periodEditor.horas) * 60) })
    };
    void run(
      () => capacity ? salvarPlanejamentoCapacidade(input) : salvarPlanejamentoExecucao(input),
      `${capacity ? "Capacidade" : "Execução"} ${periodEditor.id ? "alterada" : "registrada"}.`,
      () => setPeriodEditor(null)
    );
  };

  const confirmDelete = (event) => {
    event?.preventDefault?.();
    const { kind, items, line } = deleteTarget;
    void run(async () => {
      for (const item of items) {
        if (kind === "TAREFA") {
          await excluirPlanejamentoTarefa({ id: item.id, versao: item.versao });
        } else {
          const input = { projetoId: line.projetoId, id: item.id, versao: item.versao };
          if (kind === "CAPACIDADE") await excluirPlanejamentoCapacidade(input);
          else await excluirPlanejamentoExecucao(input);
        }
      }
    }, `${items.length > 1 ? items.length : ""} ${kind === "TAREFA" ? items.length > 1 ? "tarefas excluídas." : "Tarefa excluída." : kind === "CAPACIDADE" ? items.length > 1 ? "capacidades excluídas." : "Capacidade excluída." : items.length > 1 ? "execuções excluídas." : "Execução excluída."}`, () => {
      setDeleteTarget(null);
      if (kind === "TAREFA") taskSelection.resetSelection();
    });
  };
  const columns = useMemo(() => [
    { key: "usuario", label: "Recurso", render: (row) => userLabel(row.usuario) },
    { key: "projeto", label: "Projeto", render: (row) => `${row.projeto.chave} — ${row.projeto.nome}` },
    { key: "capacidade", label: "Capacidade", render: (row) => hours(row.capacidadeTotalMinutos) },
    { key: "estimativa", label: "Horas estimadas", render: (row) => hours(row.estimativaTotalMinutos) },
    { key: "planejado", label: "Horas planejadas", render: (row) => hours(row.alocacaoTotalMinutos) },
    { key: "saldoCapacidade", label: "Saldo capacidade", render: (row) => hours(row.saldoMinutos) },
    { key: "saldoTarefas", label: "Saldo tarefas", render: (row) => hours(row.saldoTarefasMinutos) },
    { key: "custo", label: "Custo estimado", render: (row) => costLabel(row.custosEstimados) },
    { key: "risco", label: "Risco", render: (row) => row.possuiRisco ? "Atenção" : "Regular" },
    { key: "situacao", label: "Situação", render: (row) => row.vinculoAtivo ? "Ativo" : "Inativo" }
  ], []);

  const taskColumns = useMemo(() => [
    { key: "recurso", label: "Recurso", render: (row) => userLabel(row.usuario) },
    { key: "projeto", label: "Projeto", render: (row) => row.projeto ? `${row.projeto.chave} — ${row.projeto.nome}` : "Aguardando vínculo" },
    { key: "funcionalidade", label: "Tarefa", render: (row) => row.funcionalidade },
    { key: "estimativa", label: "Horas estimadas", render: (row) => hours(row.estimativaMinutos) },
    { key: "planejado", label: "Horas planejadas", render: (row) => hours(row.planejadoMinutos) },
    { key: "saldo", label: "Saldo", render: (row) => <span className={row.sobreplanejada ? "resource-planning-task-risk" : ""}>{row.sobreplanejada && <FaExclamationTriangle aria-hidden="true" />} {hours(row.saldoMinutos)}</span> },
    { key: "valor", label: "Valor/hora", render: (row) => currency(row.valorHora, row.moeda) },
    { key: "custo", label: "Custo estimado", render: (row) => currency((Number(row.estimativaMinutos) / 60) * Number(row.valorHora), row.moeda) },
    { key: "situacao", label: "Situação", render: (row) => row.pendenteVinculo ? "Pendente de vínculo" : row.ativo ? "Ativa" : "Inativa" }
  ], []);

  const totals = rows.reduce((result, item) => ({
    capacidade: result.capacidade + item.capacidadeTotalMinutos,
    estimativa: result.estimativa + item.estimativaTotalMinutos,
    planejado: result.planejado + item.alocacaoTotalMinutos
  }), { capacidade: 0, estimativa: 0, planejado: 0 });
  const taskTotals = taskRows.reduce((result, item) => ({
    estimativa: result.estimativa + Number(item.estimativaMinutos || 0),
    planejado: result.planejado + Number(item.planejadoMinutos || 0),
    pendentes: result.pendentes + (item.pendenteVinculo ? 1 : 0)
  }), { estimativa: 0, planejado: 0, pendentes: 0 });
  const deleteCount = deleteTarget?.items?.length || 0;
  const deleteEntity = deleteTarget?.kind === "TAREFA" ? "tarefa" : deleteTarget?.kind === "CAPACIDADE" ? "capacidade" : "execução";
  const deleteEntityPlural = deleteTarget?.kind === "TAREFA" ? "tarefas" : deleteTarget?.kind === "CAPACIDADE" ? "capacidades" : "execuções";
  const deleteMessage = deleteTarget ? `Confirma a exclusão de ${deleteCount === 1 ? `1 ${deleteEntity}` : `${deleteCount} ${deleteEntityPlural}`}?` : "";

  const tabs = [
    { id: "cadastro", label: "Cadastro" },
    { id: "capacidade", label: "Capacidade" },
    { id: "tarefas", label: "Tarefas" },
    { id: "planejamento", label: "Planejamento" }
  ];

  return <section className="resource-planning">
    <header className="crud-grid resource-planning-header">
      <div>
        <span className="workspace-label">Planejamento operacional</span>
        <h2>Planejamento de recursos</h2>
        <p>Gerencie o vínculo com o projeto, a capacidade, as tarefas, os custos e os períodos de execução.</p>
      </div>
    </header>

    {error && <div className="resource-planning-feedback error" role="alert">{error}</div>}
    {success && <div className="resource-planning-feedback success" role="status">{success}</div>}
    <nav className="resource-planning-view-tabs" aria-label="Visões do planejamento">
      <button type="button" className={activeView === "vinculos" ? "active" : ""} onClick={() => setActiveView("vinculos")}>Recursos e projetos</button>
      <button type="button" className={activeView === "tarefas" ? "active" : ""} onClick={() => setActiveView("tarefas")}>Tarefas</button>
    </nav>

    {activeView === "tarefas" && panel.tarefasPendentes.length > 0 && <section className="resource-planning-pending" role="status">
      <div><strong>{panel.tarefasPendentes.length} tarefa(s) aguardando projeto</strong><span>Registros anteriores à unificação foram preservados e precisam ser vinculados.</span></div>
      <div className="resource-planning-pending-list">{panel.tarefasPendentes.map((task) =>
        <button type="button" key={task.id} onClick={() => openPendingTask(task)} disabled={!panel.permissoes?.podeAlterar}>
          {userLabel(task.recurso.usuario)} — {task.funcionalidade}
        </button>
      )}</div>
    </section>}

    {activeView === "vinculos" ? <>
      <div className="resource-planning-summary">
        <article><span>Vínculos exibidos</span><strong>{rows.length}</strong></article>
        <article><span>Capacidade</span><strong>{hours(totals.capacidade)}</strong></article>
        <article><span>Horas estimadas</span><strong>{hours(totals.estimativa)}</strong></article>
        <article><span>Horas planejadas</span><strong>{hours(totals.planejado)}</strong></article>
      </div>

      <CrudGrid
        title="Recursos por projeto"
        kicker="Planejamento"
        columns={columns}
        rows={rows}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={openLinkCreate}
        onEdit={openLinkEdit}
        onView={(line) => { setSelectedId(line.id); setViewState({ id: line.id, activeTab: "cadastro" }); }}
        filters={<>
          <label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select></label>
          <label>Recurso<select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="">Todos os recursos</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{userLabel(resource.usuario)}</option>)}</select></label>
        </>}
        emptyMessage={loading ? "Carregando planejamento..." : "Nenhum vínculo encontrado para os filtros selecionados."}
        busy={loading}
        canCreate={panel.permissoes?.podeIncluir && hasAvailableLink}
        canEdit={!!selectedLine && panel.permissoes?.podeAlterar}
        canView={!!selectedLine}
        showDelete={false}
        selectable={false}
      />
    </> : <>
      <div className="resource-planning-summary">
        <article><span>Tarefas exibidas</span><strong>{taskRows.length}</strong></article>
        <article><span>Horas estimadas</span><strong>{hours(taskTotals.estimativa)}</strong></article>
        <article><span>Horas planejadas</span><strong>{hours(taskTotals.planejado)}</strong></article>
        <article><span>Pendentes de vínculo</span><strong>{taskTotals.pendentes}</strong></article>
      </div>

      <CrudGrid
        title="Tarefas dos recursos"
        kicker="Planejamento"
        columns={taskColumns}
        rows={taskRows}
        selectedId={taskSelection.selectedId}
        selectedIds={taskSelection.selectedIds}
        onSelect={taskSelection.selectRow}
        onToggleSelect={taskSelection.toggleSelected}
        onToggleSelectAll={taskSelection.toggleVisible}
        onCreate={openTaskCreate}
        onEdit={openTaskFromRow}
        onView={(task) => { taskSelection.selectRow(task.id); setTaskViewId(task.id); }}
        onDelete={(ids) => setDeleteTarget({ kind: "TAREFA", items: allTaskRows.filter((item) => ids.includes(item.id)), line: null })}
        search={taskSearch}
        onSearchChange={setTaskSearch}
        filters={<>
          <label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select></label>
          <label>Recurso<select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="">Todos os recursos</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{userLabel(resource.usuario)}</option>)}</select></label>
          <label>Situação<select value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value)}><option value="">Todas</option><option value="ATIVA">Ativas</option><option value="INATIVA">Inativas</option><option value="PENDENTE">Pendentes de vínculo</option></select></label>
        </>}
        emptyMessage={loading ? "Carregando tarefas..." : "Nenhuma tarefa encontrada para os filtros selecionados."}
        busy={loading}
        canCreate={panel.permissoes?.podeIncluir && writableTaskLines.length > 0}
        canEdit={!!selectedTask && panel.permissoes?.podeAlterar}
        canView={!!selectedTask}
        canDelete={panel.permissoes?.podeExcluir}
        isRowSelectable={(task) => Number(task.planejadoMinutos) === 0}
        getRowLabel={(task) => task.funcionalidade}
      />
    </>}
    {linkEditor && <CrudModal
      mode={linkEditor.mode === "create" ? "create" : "edit"}
      title={linkEditor.mode === "create" ? "Vincular recurso ao projeto" : "Planejar recurso"}
      onClose={() => setLinkEditor(null)}
      onSubmit={submitLink}
      formClassName="resource-planning-form"
      modalClassName="resource-planning-modal"
      actions={<><button type="button" className="secondary" onClick={() => setLinkEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !linkEditor.cadastroRecursoId || !linkEditor.projetoId}>{saving ? "Salvando..." : "Salvar vínculo"}</button></>}
    >
      <CrudModalTabs tabs={tabs} activeTab={linkEditor.activeTab} onChange={(activeTab) => setLinkEditor({ ...linkEditor, activeTab })} />
      <CrudModalTabPanel active={linkEditor.activeTab === "cadastro"}>
        <RegistrationPanel editor={linkEditor} resources={resources} projects={availableLinkProjects} panel={panel} setEditor={setLinkEditor} />
      </CrudModalTabPanel>
      <CrudModalTabPanel active={linkEditor.activeTab === "capacidade"}>
        <PlanningTabPlaceholder line={editorLine} label="capacidade">
          {editorLine && <CapacityPanel line={editorLine} permissions={panel.permissoes} editable onCreate={() => openPeriod("CAPACIDADE", editorLine)} onEdit={(item) => openPeriod("CAPACIDADE", editorLine, item)} onView={(item) => openPeriod("CAPACIDADE", editorLine, item, true)} onDelete={(items) => setDeleteTarget({ kind: "CAPACIDADE", items, line: editorLine })} />}
        </PlanningTabPlaceholder>
      </CrudModalTabPanel>
      <CrudModalTabPanel active={linkEditor.activeTab === "tarefas"}>
        <PlanningTabPlaceholder line={editorLine} label="tarefas">
          {editorLine && <TaskPanel line={editorLine} permissions={panel.permissoes} editable onCreate={() => openTask(editorLine)} onEdit={(item) => openTask(editorLine, item)} onView={(item) => setTaskViewId(item.id)} onDelete={(items) => setDeleteTarget({ kind: "TAREFA", items, line: editorLine })} />}
        </PlanningTabPlaceholder>
      </CrudModalTabPanel>
      <CrudModalTabPanel active={linkEditor.activeTab === "planejamento"}>
        <PlanningTabPlaceholder line={editorLine} label="execuções">
          {editorLine && <ExecutionPanel line={editorLine} permissions={panel.permissoes} editable onCreate={() => openPeriod("EXECUCAO", editorLine)} onEdit={(item) => openPeriod("EXECUCAO", editorLine, item)} onView={(item) => openPeriod("EXECUCAO", editorLine, item, true)} onDelete={(items) => setDeleteTarget({ kind: "EXECUCAO", items, line: editorLine })} />}
        </PlanningTabPlaceholder>
      </CrudModalTabPanel>
    </CrudModal>}

    {viewLine && <CrudModal
      mode="view"
      title={userLabel(viewLine.usuario)}
      ariaLabel="Visualizar planejamento do recurso"
      onClose={() => setViewState(null)}
      onSubmit={(event) => event.preventDefault()}
      formClassName="resource-planning-view-form"
      modalClassName="resource-planning-modal"
      actions={<button type="button" onClick={() => setViewState(null)}>Fechar</button>}
    >
      <CrudModalTabs tabs={tabs} activeTab={viewState.activeTab} onChange={(activeTab) => setViewState({ ...viewState, activeTab })} />
      <CrudModalTabPanel active={viewState.activeTab === "cadastro"}><ViewRegistration line={viewLine} /></CrudModalTabPanel>
      <CrudModalTabPanel active={viewState.activeTab === "capacidade"}><CapacityPanel line={viewLine} onView={(item) => openPeriod("CAPACIDADE", viewLine, item, true)} /></CrudModalTabPanel>
      <CrudModalTabPanel active={viewState.activeTab === "tarefas"}><TaskPanel line={viewLine} onView={(item) => setTaskViewId(item.id)} /></CrudModalTabPanel>
      <CrudModalTabPanel active={viewState.activeTab === "planejamento"}><ExecutionPanel line={viewLine} onView={(item) => openPeriod("EXECUCAO", viewLine, item, true)} /></CrudModalTabPanel>
    </CrudModal>}

    {viewedTask && <CrudModal
      mode="view"
      title={viewedTask.funcionalidade}
      ariaLabel="Visualizar tarefa"
      onClose={() => setTaskViewId(null)}
      onSubmit={(event) => event.preventDefault()}
      formClassName="resource-planning-view-form"
      modalClassName="resource-planning-modal"
      actions={<button type="button" onClick={() => setTaskViewId(null)}>Fechar</button>}
    >
      <TaskDetails task={viewedTask} />
    </CrudModal>}

    {taskEditor && <TaskEditor
      editor={taskEditor}
      setEditor={setTaskEditor}
      lines={panel.linhas}
      saving={saving}
      onClose={() => setTaskEditor(null)}
      onSubmit={submitTask}
    />}

    {periodEditor && <PeriodEditor
      editor={periodEditor}
      setEditor={setPeriodEditor}
      line={panel.linhas.find((item) => item.id === periodEditor.projetoRecursoId)}
      saving={saving}
      onClose={() => setPeriodEditor(null)}
      onSubmit={submitPeriod}
    />}

    <ConfirmDialog
      open={!!deleteTarget}
      title={`Excluir ${deleteEntity}`}
      message={deleteMessage}
      confirmLabel="Excluir"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
      loading={saving}
    />
  </section>;
}

function RegistrationPanel({ editor, resources, projects, panel, setEditor }) {
  return <div className="resource-planning-form-grid">
    <label><span>Recurso</span><select required disabled={editor.mode === "edit"} value={editor.cadastroRecursoId} onChange={(event) => {
      const cadastroRecursoId = event.target.value;
      const projetoId = panel.projetos.find((project) => !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === cadastroRecursoId && line.projetoId === project.id))?.id || "";
      setEditor({ ...editor, cadastroRecursoId, projetoId });
    }}><option value="">Selecione</option>{resources.filter((item) => item.ativo || item.id === editor.cadastroRecursoId).map((item) => <option key={item.id} value={item.id}>{userLabel(item.usuario)}</option>)}</select><small>Recurso previamente cadastrado na empresa.</small></label>
    <label><span>Projeto</span><select required disabled={editor.mode === "edit"} value={editor.projetoId} onChange={(event) => setEditor({ ...editor, projetoId: event.target.value })}><option value="">Selecione</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select><small>Projeto em que capacidade, tarefas e execuções serão planejadas.</small></label>
    <label className="resource-planning-check"><input type="checkbox" checked={editor.ativo} disabled={editor.mode === "create"} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} /><span><strong>Vínculo ativo</strong><small>Ao desativar, capacidade, tarefas, execuções, custos e histórico serão preservados.</small></span></label>
  </div>;
}

function ViewRegistration({ line }) {
  return <div className="resource-planning-view-grid">
    <article><span>Recurso</span><strong>{userLabel(line.usuario)}</strong></article>
    <article><span>Projeto</span><strong>{line.projeto.chave} — {line.projeto.nome}</strong></article>
    <article><span>Situação do recurso</span><strong>{line.recursoAtivo ? "Ativo" : "Inativo"}</strong></article>
    <article><span>Situação do vínculo</span><strong>{line.vinculoAtivo ? "Ativo" : "Inativo"}</strong></article>
    <article><span>Capacidade</span><strong>{hours(line.capacidadeTotalMinutos)}</strong></article>
    <article><span>Custo estimado</span><strong>{costLabel(line.custosEstimados)}</strong></article>
  </div>;
}

function TaskDetails({ task }) {
  const executions = task.line?.alocacoes.filter((item) => item.tarefaId === task.id) || [];
  const estimatedCost = (Number(task.estimativaMinutos) / 60) * Number(task.valorHora);
  const rateColumns = [
    { key: "valorHora", label: "Valor/hora", render: (rate) => currency(rate.valorHora, rate.moeda) },
    { key: "moeda", label: "Moeda" },
    { key: "criadoEm", label: "Alterado em", render: (rate) => dateTime(rate.criadoEm) },
    { key: "criadoPor", label: "Alterado por", render: (rate) => userLabel(rate.criadoPor) }
  ];
  const executionColumns = [
    { key: "inicioEm", label: "Início", render: (item) => dateLabel(item.inicioEm) },
    { key: "fimEm", label: "Fim", render: (item) => dateLabel(item.fimEm) },
    { key: "horas", label: "Horas", render: (item) => hours(item.alocacaoMinutos) },
    { key: "uso", label: "Uso no período", render: (item) => `${item.percentualAlocado}%` },
    { key: "risco", label: "Risco", render: (item) => item.sobrealocado ? "Sobrealocada" : "Regular" }
  ];
  return <>
    <div className="resource-planning-view-grid">
      <article><span>Recurso</span><strong>{userLabel(task.usuario)}</strong></article>
      <article><span>Projeto</span><strong>{task.projeto ? `${task.projeto.chave} — ${task.projeto.nome}` : "Pendente de vínculo"}</strong></article>
      <article><span>Horas estimadas</span><strong>{hours(task.estimativaMinutos)}</strong></article>
      <article><span>Horas planejadas</span><strong>{hours(task.planejadoMinutos)}</strong></article>
      <article><span>Saldo</span><strong className={task.sobreplanejada ? "risk" : ""}>{hours(task.saldoMinutos)}</strong></article>
      <article><span>Valor por hora</span><strong>{currency(task.valorHora, task.moeda)}</strong></article>
      <article><span>Custo estimado</span><strong>{currency(estimatedCost, task.moeda)}</strong></article>
      <article><span>Situação</span><strong>{task.pendenteVinculo ? "Pendente de vínculo" : task.ativo ? "Ativa" : "Inativa"}</strong></article>
    </div>
    {task.observacao && <div className="resource-planning-task-observation"><span>Observação</span><p>{task.observacao}</p></div>}
    <CrudGrid compact title="Histórico de valores" kicker="Tarefa" description={`${task.taxas?.length || 0} alteração(ões) registrada(s)`} columns={rateColumns} rows={task.taxas || []} showCreate={false} showEdit={false} showView={false} showDelete={false} selectable={false} emptyMessage="Nenhuma alteração de valor registrada." />
    <CrudGrid compact title="Execuções planejadas" kicker="Tarefa" description={`${executions.length} período(s)`} columns={executionColumns} rows={executions} showCreate={false} showEdit={false} showView={false} showDelete={false} selectable={false} emptyMessage="Nenhuma execução planejada para esta tarefa." />
  </>;
}
function PlanningTabPlaceholder({ line, label, children }) {
  return line ? children : <div className="resource-planning-placeholder"><strong>{label[0].toUpperCase() + label.slice(1)} disponíveis após salvar</strong><p>Conclua o vínculo entre recurso e projeto para continuar.</p></div>;
}

function writable(line, editable) {
  return editable && line.recursoAtivo && line.vinculoAtivo && !line.projeto?.arquivadoEm;
}

function CapacityPanel({ line, permissions = {}, editable = false, onCreate, onEdit, onView, onDelete }) {
  const canWrite = writable(line, editable);
  const selection = useCrudSelection(line.capacidades);
  const selected = line.capacidades.find((item) => item.id === selection.selectedId);
  const columns = [
    { key: "inicioEm", label: "Início", render: (item) => dateLabel(item.inicioEm) },
    { key: "fimEm", label: "Fim", render: (item) => dateLabel(item.fimEm) },
    { key: "capacidade", label: "Capacidade", render: (item) => hours(item.capacidadeMinutos) },
    { key: "planejado", label: "Horas planejadas", render: (item) => hours(item.alocadoMinutos) },
    { key: "uso", label: "Uso", render: (item) => `${item.percentualAlocado}%` }
  ];
  return <>
    {editable && !canWrite && <ReadonlyNotice />}
    <CrudGrid compact title="Capacidade disponível" kicker="Planejamento" description={`${hours(line.capacidadeTotalMinutos)} cadastradas`} columns={columns} rows={line.capacidades} selectedId={selection.selectedId} selectedIds={selection.selectedIds} onSelect={selection.selectRow} onToggleSelect={selection.toggleSelected} onToggleSelectAll={selection.toggleVisible} onCreate={onCreate} onEdit={onEdit} onView={onView} onDelete={(ids) => onDelete?.(line.capacidades.filter((item) => ids.includes(item.id)))} emptyMessage="Nenhum período de capacidade cadastrado." canCreate={canWrite && permissions.podeIncluir} canEdit={!!selected && canWrite && permissions.podeAlterar} canView={!!selected && !!onView} canDelete={canWrite && permissions.podeExcluir} showCreate={editable} showEdit={editable} showView={!!onView} showDelete={editable} selectable={editable} getRowLabel={(item) => `capacidade de ${dateLabel(item.inicioEm)} a ${dateLabel(item.fimEm)}`} />
  </>;
}
function TaskPanel({ line, permissions = {}, editable = false, onCreate, onEdit, onView, onDelete }) {
  const canWrite = writable(line, editable);
  const selection = useCrudSelection(line.tarefas);
  const selected = line.tarefas.find((item) => item.id === selection.selectedId);
  const columns = [
    { key: "funcionalidade", label: "Descrição" },
    { key: "estimativa", label: "Estimativa", render: (item) => hours(item.estimativaMinutos) },
    { key: "planejado", label: "Planejado", render: (item) => hours(item.planejadoMinutos) },
    { key: "saldo", label: "Saldo", render: (item) => hours(item.saldoMinutos) },
    { key: "valor", label: "Valor/hora", render: (item) => currency(item.valorHora, item.moeda) },
    { key: "situacao", label: "Situação", render: (item) => item.ativo ? "Ativa" : "Inativa" }
  ];
  return <>
    {editable && !canWrite && <ReadonlyNotice />}
    <CrudGrid compact title="Tarefas" kicker="Planejamento" description={`${line.tarefas.length} cadastrada(s) · última taxa ${dateTime(line.tarefas[0]?.taxas?.[0]?.criadoEm)}`} columns={columns} rows={line.tarefas} selectedId={selection.selectedId} selectedIds={selection.selectedIds} onSelect={selection.selectRow} onToggleSelect={selection.toggleSelected} onToggleSelectAll={selection.toggleVisible} onCreate={onCreate} onEdit={onEdit} onView={onView} onDelete={(ids) => onDelete?.(line.tarefas.filter((item) => ids.includes(item.id)))} emptyMessage="Nenhuma tarefa cadastrada para este recurso e projeto." canCreate={canWrite && permissions.podeIncluir} canEdit={!!selected && canWrite && permissions.podeAlterar} canView={!!selected && !!onView} canDelete={canWrite && permissions.podeExcluir} showCreate={editable} showEdit={editable} showView={!!onView} showDelete={editable} selectable={editable} isRowSelectable={(item) => Number(item.planejadoMinutos) === 0} getRowLabel={(item) => item.funcionalidade} />
  </>;
}
function ExecutionPanel({ line, permissions = {}, editable = false, onCreate, onEdit, onView, onDelete }) {
  const canWrite = writable(line, editable);
  const hasTask = line.tarefas.some((item) => item.ativo);
  const selection = useCrudSelection(line.alocacoes);
  const selected = line.alocacoes.find((item) => item.id === selection.selectedId);
  const columns = [
    { key: "tarefa", label: "Tarefa", render: (item) => line.tarefas.find((task) => task.id === item.tarefaId)?.funcionalidade || item.atividade || "Pendente de vínculo" },
    { key: "inicioEm", label: "Início", render: (item) => dateLabel(item.inicioEm) },
    { key: "fimEm", label: "Fim", render: (item) => dateLabel(item.fimEm) },
    { key: "horas", label: "Horas", render: (item) => hours(item.alocacaoMinutos) },
    { key: "uso", label: "Uso no período", render: (item) => `${item.percentualAlocado}%` },
    { key: "risco", label: "Risco", render: (item) => !item.tarefaId ? "Tarefa pendente" : item.sobrealocado ? "Sobrealocado" : "Regular" }
  ];
  return <>
    {editable && !canWrite && <ReadonlyNotice />}
    {editable && canWrite && !hasTask && <div className="resource-planning-inline-notice">Cadastre uma tarefa ativa antes de adicionar uma execução.</div>}
    <CrudGrid compact title="Execuções planejadas" kicker="Planejamento" description={`${hours(line.alocacaoTotalMinutos)} planejadas`} columns={columns} rows={line.alocacoes} selectedId={selection.selectedId} selectedIds={selection.selectedIds} onSelect={selection.selectRow} onToggleSelect={selection.toggleSelected} onToggleSelectAll={selection.toggleVisible} onCreate={onCreate} onEdit={onEdit} onView={onView} onDelete={(ids) => onDelete?.(line.alocacoes.filter((item) => ids.includes(item.id)))} emptyMessage="Nenhuma execução planejada." canCreate={canWrite && hasTask && permissions.podeIncluir} canEdit={!!selected && canWrite && permissions.podeAlterar} canView={!!selected && !!onView} canDelete={canWrite && permissions.podeExcluir} showCreate={editable} showEdit={editable} showView={!!onView} showDelete={editable} selectable={editable} getRowLabel={(item) => `execução de ${dateLabel(item.inicioEm)} a ${dateLabel(item.fimEm)}`} />
  </>;
}
function TaskEditor({ editor, setEditor, lines, saving, onClose, onSubmit }) {
  const selectableLines = lines.filter((line) => (line.recursoAtivo && line.vinculoAtivo && !line.projeto.arquivadoEm) || line.id === editor.projetoRecursoId);
  const eligibleLines = selectableLines.filter((line) => line.cadastroRecursoId === editor.recursoId);
  const eligibleResources = Array.from(new Map(selectableLines.map((line) => [line.cadastroRecursoId, { id: line.cadastroRecursoId, usuario: line.usuario }])).values());
  const estimatedCost = Number(editor.estimativaHoras || 0) * Number(editor.valorHora || 0);
  return <CrudModal
    mode={editor.id ? "edit" : "create"}
    title={editor.pendente ? "Vincular tarefa ao projeto" : editor.id ? "Alterar tarefa" : "Cadastrar tarefa"}
    onClose={onClose}
    onSubmit={onSubmit}
    formClassName="resource-planning-task-form"
    modalClassName="resource-planning-task-modal"
    actions={<><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" disabled={saving || !editor.projetoRecursoId || !editor.funcionalidade.trim() || Number(editor.estimativaHoras) <= 0 || Number(editor.valorHora) <= 0 || !/^[A-Z]{3}$/.test(editor.moeda)}>{saving ? "Salvando..." : "Salvar"}</button></>}
  >
    <div className="resource-planning-task-grid">
      <label><span>Recurso</span><select required disabled={!!editor.id || editor.lockLink} value={editor.recursoId} onChange={(event) => { const recursoId = event.target.value; const projetoRecursoId = selectableLines.find((line) => line.cadastroRecursoId === recursoId)?.id || ""; setEditor({ ...editor, recursoId, projetoRecursoId }); }}><option value="">Selecione</option>{eligibleResources.map((resource) => <option key={resource.id} value={resource.id}>{userLabel(resource.usuario)}</option>)}</select><small>Recurso previamente vinculado a pelo menos um projeto ativo.</small></label>
      <label><span>Projeto</span><select required disabled={editor.lockLink || (!!editor.id && !editor.pendente)} value={editor.projetoRecursoId} onChange={(event) => setEditor({ ...editor, projetoRecursoId: event.target.value })}><option value="">Selecione</option>{eligibleLines.map((line) => <option key={line.id} value={line.id}>{line.projeto.chave} — {line.projeto.nome}</option>)}</select><small>A tarefa pertence especificamente a este recurso dentro do projeto.</small></label>
      <label className="wide"><span>Funcionalidade</span><textarea required maxLength={500} rows={4} value={editor.funcionalidade} onChange={(event) => setEditor({ ...editor, funcionalidade: event.target.value })} placeholder="Descreva o que esta tarefa faz" /><small>Descrição única reutilizada pelos períodos de execução.</small></label>
      <label><span>Horas estimadas</span><input required type="number" min="0.01" step="0.01" value={editor.estimativaHoras} onChange={(event) => setEditor({ ...editor, estimativaHoras: event.target.value })} /></label>
      <label><span>Valor por hora</span><input required type="number" min="0.01" step="0.01" value={editor.valorHora} onChange={(event) => setEditor({ ...editor, valorHora: event.target.value })} /></label>
      <label><span>Moeda</span><input required maxLength={3} value={editor.moeda} onChange={(event) => setEditor({ ...editor, moeda: event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) })} /></label>
      <label className="wide"><span>Observação</span><textarea maxLength={500} rows={3} value={editor.observacao} onChange={(event) => setEditor({ ...editor, observacao: event.target.value })} /></label>
      <label className="resource-planning-check wide"><input type="checkbox" checked={editor.ativo} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} /><span><strong>Tarefa ativa</strong><small>Tarefas inativas permanecem no histórico, mas não recebem novas execuções.</small></span></label>
      <div className="resource-planning-cost-preview wide"><span>Custo estimado</span><strong>{currency(estimatedCost, editor.moeda)}</strong><small>Horas estimadas multiplicadas pelo valor cobrado por hora.</small></div>
      {editor.id && !editor.pendente && <TaskHistoryNote />}
    </div>
  </CrudModal>;
}

function TaskHistoryNote() {
  return <div className="resource-planning-history-note wide"><strong>Histórico preservado</strong><span>Alterações de valor por hora continuam registradas e aparecem no modo de visualização.</span></div>;
}

function PeriodEditor({ editor, setEditor, line, saving, onClose, onSubmit }) {
  const capacity = editor.kind === "CAPACIDADE";
  const readonly = editor.viewOnly;
  return <CrudModal
    mode={readonly ? "view" : editor.id ? "edit" : "create"}
    title={readonly ? `Visualizar ${capacity ? "capacidade" : "execução planejada"}` : `${editor.id ? "Alterar" : "Registrar"} ${capacity ? "capacidade" : "execução planejada"}`}
    onClose={onClose}
    onSubmit={readonly ? (event) => event.preventDefault() : onSubmit}
    formClassName="resource-planning-period-form"
    modalClassName="resource-planning-period-modal"
    actions={<><button type="button" className="secondary" onClick={onClose}>{readonly ? "Fechar" : "Cancelar"}</button>{!readonly && <button type="submit" disabled={saving || (!capacity && !editor.tarefaId) || Number(editor.horas) <= 0}>Salvar</button>}</>}
  >
    {!capacity && <label className="wide"><span>Tarefa</span><select required disabled={readonly} value={editor.tarefaId} onChange={(event) => setEditor({ ...editor, tarefaId: event.target.value })}><option value="">Selecione</option>{line?.tarefas.filter((item) => item.ativo || item.id === editor.tarefaId).map((task) => <option key={task.id} value={task.id}>{task.funcionalidade}</option>)}</select><small>A descrição da execução será obtida da tarefa selecionada.</small></label>}
    <div className="resource-planning-period-grid">
      <label><span>Início</span><input required disabled={readonly} type="date" value={editor.inicioEm} onChange={(event) => setEditor({ ...editor, inicioEm: event.target.value })} /></label>
      <label><span>Fim</span><input required disabled={readonly} type="date" value={editor.fimEm} onChange={(event) => setEditor({ ...editor, fimEm: event.target.value })} /></label>
      <label><span>Horas</span><input required disabled={readonly} type="number" min="0.01" step="0.01" value={editor.horas} onChange={(event) => setEditor({ ...editor, horas: event.target.value })} /><small>Informe horas com até duas casas decimais.</small></label>
    </div>
  </CrudModal>;
}
