import { useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  excluirPlanejamentoTarefa,
  getPlanejamentoRecursos,
  salvarPlanejamentoTarefa
} from "../../services/Projetos/PlanejamentoRecursoService";
import { useCrudSelection } from "../hooks/useCrudSelection";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import { FeedbackMessage } from "./CrudFeedback";
import ProjectResourceManagement from "./ProjectResourceManagement";
import ProjectResourceExecutionManagement from "./ProjectResourceExecutionManagement";
import "../styles/crudGrid.css";
import "../styles/projectResourcePlanning.css";

const emptyPanel = { recursos: [], projetos: [], linhas: [], tarefas: [], tarefasPendentes: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";
const hours = (minutes) => `${(Number(minutes || 0) / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;
const currency = (value, moeda = "BRL") => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(Number(value || 0)); }
  catch { return `${moeda} ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`; }
};
const uniqueLabels = (values) => Array.from(new Set(values.filter(Boolean)));
const taskResourceLabel = (task) => {
  const labels = uniqueLabels((task.recursos || []).map((item) => userLabel(item.recurso?.usuario)));
  return labels.length ? labels.join(", ") : "Aguardando recurso";
};

export default function ProjectResourcePlanningManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [activeView, setActiveView] = useState("cadastro");
  const [projectFilter, setProjectFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [taskEditor, setTaskEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const projects = useMemo(() => panel.projetos.slice().sort((a, b) => a.nome.localeCompare(b.nome)), [panel.projetos]);
  const resources = useMemo(() => panel.recursos.slice().sort((a, b) => userLabel(a.usuario).localeCompare(userLabel(b.usuario))), [panel.recursos]);
  const allTaskRows = useMemo(
    () => panel.tarefas.slice().sort((a, b) => a.funcionalidade.localeCompare(b.funcionalidade)),
    [panel.tarefas]
  );
  const taskRows = useMemo(() => {
    const search = taskSearch.trim().toLocaleLowerCase("pt-BR");
    const recursosDoProjeto = new Set(panel.linhas
      .filter((line) => !projectFilter || line.projetoId === projectFilter)
      .map((line) => line.cadastroRecursoId));
    return allTaskRows.filter((item) => {
      const status = item.pendenteRecurso ? "PENDENTE" : item.ativo ? "ATIVA" : "INATIVA";
      const searchable = [item.funcionalidade, taskResourceLabel(item)].join(" ").toLocaleLowerCase("pt-BR");
      return (!projectFilter || item.recursoIds.some((id) => recursosDoProjeto.has(id)))
        && (!resourceFilter || item.recursoIds.includes(resourceFilter))
        && (!taskStatusFilter || status === taskStatusFilter)
        && (!search || searchable.includes(search));
    });
  }, [allTaskRows, panel.linhas, projectFilter, resourceFilter, taskSearch, taskStatusFilter]);
  const taskSelection = useCrudSelection(taskRows);
  const selectedTask = useMemo(() => allTaskRows.find((item) => item.id === taskSelection.selectedId) || null, [allTaskRows, taskSelection.selectedId]);
  const writableTaskResources = useMemo(() => resources.filter((resource) => resource.ativo), [resources]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getPlanejamentoRecursos();
      setPanel(result || emptyPanel);
    } catch (loadError) {
      setError(loadError.message);
      setPanel(emptyPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectActiveView = (view) => {
    const shouldReloadPlanning = activeView === "cadastro" && view !== "cadastro";
    setActiveView(view);
    if (shouldReloadPlanning) void load();
  };

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


  const openTask = (task = null, mode = "edit", initialResourceId = null) => setTaskEditor({
    mode,
    id: task?.id,
    versao: task?.versao,
    recursoIds: task?.recursoIds || (initialResourceId ? [initialResourceId] : []),
    funcionalidade: task?.funcionalidade || "",
    estimativaHoras: task ? String(Number(task.estimativaMinutos) / 60) : "",
    valorHora: task ? String(Number(task.valorHora)) : "",
    moeda: task?.moeda || "BRL",
    observacao: task?.observacao || "",
    ativo: task?.ativo ?? true,
    pendente: !!task?.pendenteRecurso
  });
  const openPendingTask = (task) => openTask(task, "edit");
  const openTaskCreate = () => {
    const preferredLine = panel.linhas.find((item) =>
      item.recursoAtivo && (!projectFilter || item.projetoId === projectFilter) && (!resourceFilter || item.cadastroRecursoId === resourceFilter)
    );
    const initialResourceId = preferredLine?.cadastroRecursoId
      || writableTaskResources.find((item) => !resourceFilter || item.id === resourceFilter)?.id
      || writableTaskResources[0]?.id;
    if (initialResourceId) openTask(null, "create", initialResourceId);
  };
  const openTaskFromRow = (task) => openTask(task, "edit");
  const openTaskView = (task) => {
    taskSelection.selectRow(task.id);
    openTask(task, "view");
  };

  const submitTask = (event) => {
    event.preventDefault();
    if (taskEditor.mode === "view") return;
    const input = {
      recursoIds: taskEditor.recursoIds,
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
      taskEditor.pendente ? "Tarefa vinculada aos recursos." : taskEditor.id ? "Tarefa alterada." : "Tarefa cadastrada.",
      () => setTaskEditor(null)
    );
  };
  const confirmDelete = (event) => {
    event?.preventDefault?.();
    const { items } = deleteTarget;
    void run(async () => {
      for (const item of items) {
        await excluirPlanejamentoTarefa({ id: item.id, versao: item.versao });
      }
    }, items.length > 1 ? String(items.length) + " tarefas excluídas." : "Tarefa excluída.", () => {
      setDeleteTarget(null);
      taskSelection.resetSelection();
    });
  };
  const taskColumns = useMemo(() => [
    { key: "recurso", label: "Recursos", render: (row) => taskResourceLabel(row) },
    { key: "funcionalidade", label: "Tarefa", render: (row) => row.funcionalidade },
    { key: "estimativa", label: "Horas estimadas", render: (row) => hours(row.estimativaMinutos) },
    { key: "planejado", label: "Horas planejadas", render: (row) => hours(row.planejadoMinutos) },
    { key: "saldo", label: "Saldo", render: (row) => <span className={row.sobreplanejada ? "resource-planning-task-risk" : ""}>{row.sobreplanejada && <FaExclamationTriangle aria-hidden="true" />} {hours(row.saldoMinutos)}</span> },
    { key: "valor", label: "Valor/hora", render: (row) => currency(row.valorHora, row.moeda) },
    { key: "custo", label: "Custo estimado", render: (row) => currency((Number(row.estimativaMinutos) / 60) * Number(row.valorHora), row.moeda) },
    { key: "situacao", label: "Situação", render: (row) => row.pendenteRecurso ? "Pendente de recurso" : row.ativo ? "Ativa" : "Inativa" }
  ], []);

  const taskTotals = taskRows.reduce((result, item) => ({
    estimativa: result.estimativa + Number(item.estimativaMinutos || 0),
    planejado: result.planejado + Number(item.planejadoMinutos || 0),
    pendentes: result.pendentes + (item.pendenteRecurso ? 1 : 0)
  }), { estimativa: 0, planejado: 0, pendentes: 0 });
  const deleteCount = deleteTarget?.items?.length || 0;
  const deleteMessage = deleteTarget
    ? "Confirma a exclusão de " + (deleteCount === 1 ? "1 tarefa" : String(deleteCount) + " tarefas") + "?"
    : "";

  return <section className="resource-planning">
    <header className="crud-grid resource-planning-header">
      <div>
        <span className="workspace-label">Planejamento operacional</span>
        <h2>Planejamento de recursos</h2>
        <p>Cadastre recursos e gerencie as tarefas atribuídas a eles.</p>
      </div>
    </header>

    {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
    {success && <FeedbackMessage type="success" compact>{success}</FeedbackMessage>}
    <nav className="resource-planning-view-tabs" aria-label="Visões do planejamento">
      <button type="button" className={activeView === "cadastro" ? "active" : ""} aria-current={activeView === "cadastro" ? "page" : undefined} onClick={() => selectActiveView("cadastro")}>Cadastro de recursos</button>
      <button type="button" className={activeView === "tarefas" ? "active" : ""} aria-current={activeView === "tarefas" ? "page" : undefined} onClick={() => selectActiveView("tarefas")}>Cadastro de tarefas</button>
      <button type="button" className={activeView === "planejamento" ? "active" : ""} aria-current={activeView === "planejamento" ? "page" : undefined} onClick={() => selectActiveView("planejamento")}>Cadastro de planejamento</button>
    </nav>

    {activeView === "cadastro" && <ProjectResourceManagement />}

    {activeView === "tarefas" && panel.tarefasPendentes.length > 0 && <section className="resource-planning-pending" role="status">
      <div><strong>{panel.tarefasPendentes.length} tarefa(s) aguardando recurso</strong><span>Registros anteriores foram preservados e precisam receber ao menos um recurso.</span></div>
      <div className="resource-planning-pending-list">{panel.tarefasPendentes.map((task) =>
        <button type="button" key={task.id} onClick={() => openPendingTask(task)} disabled={!panel.permissoes?.podeAlterar}>
          {task.funcionalidade}
        </button>
      )}</div>
    </section>}

    {activeView === "tarefas" && <>
      <div className="resource-planning-summary">
        <article><span>Tarefas exibidas</span><strong>{taskRows.length}</strong></article>
        <article><span>Horas estimadas</span><strong>{hours(taskTotals.estimativa)}</strong></article>
        <article><span>Horas planejadas</span><strong>{hours(taskTotals.planejado)}</strong></article>
        <article><span>Pendentes de recurso</span><strong>{taskTotals.pendentes}</strong></article>
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
        onView={openTaskView}
        onDelete={(ids) => setDeleteTarget({ items: allTaskRows.filter((item) => ids.includes(item.id)) })}
        search={taskSearch}
        onSearchChange={setTaskSearch}
        filters={<>
          <label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select></label>
          <label>Recurso<select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="">Todos os recursos</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{userLabel(resource.usuario)}</option>)}</select></label>
          <label>Situação<select value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value)}><option value="">Todas</option><option value="ATIVA">Ativas</option><option value="INATIVA">Inativas</option><option value="PENDENTE">Pendentes de recurso</option></select></label>
        </>}
        emptyMessage={loading ? "Carregando tarefas..." : "Nenhuma tarefa encontrada para os filtros selecionados."}
        busy={loading}
        canCreate={panel.permissoes?.podeIncluir === true && writableTaskResources.length > 0}
        canEdit={!!selectedTask && panel.permissoes?.podeAlterar === true}
        canView={!!selectedTask}
        canDelete={panel.permissoes?.podeExcluir === true}
        isRowSelectable={(task) => Number(task.planejadoMinutos) === 0}
        getRowLabel={(task) => task.funcionalidade}
      />
    </>}

    {activeView === "planejamento" && <ProjectResourceExecutionManagement />}

    {taskEditor && <TaskEditor
      editor={taskEditor}
      setEditor={setTaskEditor}
      resources={resources}
      saving={saving}
      onClose={() => setTaskEditor(null)}
      onSubmit={submitTask}
    />}
    <ConfirmDialog
      open={!!deleteTarget}
      title="Excluir tarefa"
      message={deleteMessage}
      confirmLabel="Excluir"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
      loading={saving}
    />
  </section>;
}

function TaskEditor({ editor, setEditor, resources, saving, onClose, onSubmit }) {
  const readonly = editor.mode === "view";
  const selectedIds = new Set(editor.recursoIds);
  const selectableResources = resources
    .filter((resource) => resource.ativo || selectedIds.has(resource.id))
    .slice()
    .sort((a, b) => userLabel(a.usuario).localeCompare(userLabel(b.usuario)));
  const estimatedCost = Number(editor.estimativaHoras || 0) * Number(editor.valorHora || 0);
  const toggleResource = (id) => {
    const recursoIds = selectedIds.has(id)
      ? editor.recursoIds.filter((item) => item !== id)
      : [...editor.recursoIds, id];
    setEditor({ ...editor, recursoIds });
  };

  return <CrudModal
    mode={readonly ? "view" : editor.id ? "edit" : "create"}
    title={readonly ? "Visualizar tarefa" : editor.pendente ? "Vincular tarefa aos recursos" : editor.id ? "Alterar tarefa" : "Cadastrar tarefa"}
    onClose={onClose}
    onSubmit={readonly ? (event) => event.preventDefault() : onSubmit}
    formClassName="resource-planning-task-form"
    modalClassName="resource-planning-task-modal"
    actions={readonly
      ? <button type="button" onClick={onClose}>Fechar</button>
      : <><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" disabled={saving || editor.recursoIds.length === 0 || !editor.funcionalidade.trim() || Number(editor.estimativaHoras) <= 0 || Number(editor.valorHora) <= 0 || !/^[A-Z]{3}$/.test(editor.moeda)}>{saving ? "Salvando..." : "Salvar"}</button></>}
  >
    <div className="resource-planning-task-grid">
      <fieldset className="resource-planning-task-links wide">
        <legend>Recursos</legend>
        <p>Selecione um ou mais recursos responsáveis pela tarefa.</p>
        <div className="resource-planning-task-link-options">
          {selectableResources.map((resource) => {
            const selected = selectedIds.has(resource.id);
            return <label key={resource.id} className={"resource-planning-task-link-option" + (selected ? " selected" : "")}>
              <input type="checkbox" checked={selected} disabled={readonly} onChange={() => toggleResource(resource.id)} />
              <span><strong>{userLabel(resource.usuario)}</strong><small>{resource.ativo ? "Recurso ativo" : "Recurso inativo"}</small></span>
            </label>;
          })}
        </div>
        {!selectableResources.length && <small>Nenhum recurso cadastrado está disponível.</small>}
      </fieldset>
      <label className="wide"><span>Funcionalidade</span><textarea required disabled={readonly} maxLength={500} rows={4} value={editor.funcionalidade} onChange={(event) => setEditor({ ...editor, funcionalidade: event.target.value })} placeholder="Descreva o que esta tarefa faz" /><small>Descrição única compartilhada pelos recursos selecionados.</small></label>
      <label><span>Horas estimadas</span><input required disabled={readonly} type="number" min="0.01" step="0.01" value={editor.estimativaHoras} onChange={(event) => setEditor({ ...editor, estimativaHoras: event.target.value })} /></label>
      <label><span>Valor por hora</span><input required disabled={readonly} type="number" min="0.01" step="0.01" value={editor.valorHora} onChange={(event) => setEditor({ ...editor, valorHora: event.target.value })} /></label>
      <label><span>Moeda</span><input required disabled={readonly} maxLength={3} value={editor.moeda} onChange={(event) => setEditor({ ...editor, moeda: event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) })} /></label>
      <label className="wide"><span>Observação</span><textarea disabled={readonly} maxLength={500} rows={3} value={editor.observacao} onChange={(event) => setEditor({ ...editor, observacao: event.target.value })} /></label>
      <label className="resource-planning-check wide"><input type="checkbox" checked={editor.ativo} disabled={readonly} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} /><span><strong>Tarefa ativa</strong><small>Tarefas inativas permanecem no histórico, mas não recebem novas execuções.</small></span></label>
      <div className="resource-planning-cost-preview wide"><span>Custo estimado</span><strong>{currency(estimatedCost, editor.moeda)}</strong><small>Horas estimadas multiplicadas pelo valor cobrado por hora.</small></div>
    </div>
  </CrudModal>;
}
