import { useCallback, useEffect, useMemo, useState } from "react";
import {
  excluirPlanejamentoExecucao,
  getPlanejamentoRecursos,
  salvarPlanejamentoExecucao
} from "../../services/Projetos/PlanejamentoRecursoService";
import { useCrudSelection } from "../hooks/useCrudSelection";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import { FeedbackMessage } from "./CrudFeedback";
import "../styles/projectResourceExecution.css";

const emptyPanel = { recursos: [], projetos: [], linhas: [], tarefas: [], tarefasPendentes: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";
const hours = (minutes) => `${(Number(minutes || 0) / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;
const dateInput = (value) => value ? String(value).slice(0, 10) : "";
const dateLabel = (value) => value
  ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
  : "—";

const isWritableLine = (line) => line?.recursoAtivo && line?.vinculoAtivo && !line?.projeto?.arquivadoEm;
const taskForExecution = (line, execution, allTasks) =>
  line?.tarefas?.find((task) => task.id === execution.tarefaId)
  || allTasks.find((task) => task.id === execution.tarefaId)
  || null;

export default function ProjectResourceExecutionManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [projectFilter, setProjectFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPanel((await getPlanejamentoRecursos()) || emptyPanel);
    } catch (loadError) {
      setError(loadError.message);
      setPanel(emptyPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const allRows = useMemo(() => panel.linhas.flatMap((line) =>
    (line.alocacoes || []).map((execution) => ({
      ...execution,
      line,
      project: line.projeto,
      user: line.usuario,
      task: taskForExecution(line, execution, panel.tarefas)
    }))
  ).sort((left, right) => String(right.inicioEm).localeCompare(String(left.inicioEm))), [panel.linhas, panel.tarefas]);

  const rows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return allRows.filter((row) => {
      const searchable = [row.project?.chave, row.project?.nome, userLabel(row.user), row.task?.funcionalidade, row.atividade]
        .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return (!projectFilter || row.project?.id === projectFilter)
        && (!resourceFilter || row.line?.cadastroRecursoId === resourceFilter)
        && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allRows, projectFilter, resourceFilter, search]);

  const projects = useMemo(() => panel.projetos.slice().sort((a, b) => a.nome.localeCompare(b.nome)), [panel.projetos]);
  const resources = useMemo(() => panel.recursos.slice().sort((a, b) => userLabel(a.usuario).localeCompare(userLabel(b.usuario))), [panel.recursos]);
  const writableLines = useMemo(() => panel.linhas.filter(isWritableLine), [panel.linhas]);
  const selection = useCrudSelection(rows);
  const selectedExecution = useMemo(() => allRows.find((item) => item.id === selection.selectedId) || null, [allRows, selection.selectedId]);
  const selectedEditable = selectedExecution
    && isWritableLine(selectedExecution.line)
    && (!selectedExecution.task || selectedExecution.task.ativo);

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

  const openCreate = () => {
    const preferredLine = writableLines.find((line) =>
      (!projectFilter || line.projetoId === projectFilter)
      && (!resourceFilter || line.cadastroRecursoId === resourceFilter)
      && line.tarefas.some((task) => task.ativo)
    ) || writableLines.find((line) => line.tarefas.some((task) => task.ativo));
    if (!preferredLine) return;
    setEditor({
      mode: "create",
      projectId: preferredLine.projetoId,
      projetoRecursoId: preferredLine.id,
      tarefaId: preferredLine.tarefas.find((task) => task.ativo)?.id || "",
      inicioEm: "",
      fimEm: ""
    });
  };

  const openExecution = (execution, mode) => {
    if (!execution) return;
    selection.selectRow(execution.id);
    setEditor({
      mode,
      id: execution.id,
      versao: execution.versao,
      projectId: execution.project.id,
      projetoRecursoId: execution.line.id,
      tarefaId: execution.tarefaId || "",
      inicioEm: dateInput(execution.inicioEm),
      fimEm: dateInput(execution.fimEm)
    });
  };

  const submit = (event) => {
    event.preventDefault();
    if (editor.mode === "view") return;
    const input = {
      projetoId: editor.projectId,
      projetoRecursoId: editor.projetoRecursoId,
      tarefaId: editor.tarefaId,
      inicioEm: editor.inicioEm,
      fimEm: editor.fimEm,
      ...(editor.id ? { id: editor.id, versao: editor.versao } : {})
    };
    void run(
      () => salvarPlanejamentoExecucao(input),
      editor.id ? "Planejamento alterado." : "Planejamento incluído.",
      () => setEditor(null)
    );
  };

  const confirmDelete = (event) => {
    event?.preventDefault?.();
    const items = deleteTarget?.items || [];
    void run(async () => {
      for (const item of items) {
        await excluirPlanejamentoExecucao({ projetoId: item.project.id, id: item.id, versao: item.versao });
      }
    }, items.length > 1 ? `${items.length} planejamentos excluídos.` : "Planejamento excluído.", () => {
      setDeleteTarget(null);
      selection.resetSelection();
    });
  };

  const columns = useMemo(() => [
    { key: "projeto", label: "Projeto", render: (row) => `${row.project.chave} — ${row.project.nome}` },
    { key: "recurso", label: "Recurso", render: (row) => userLabel(row.user) },
    { key: "tarefa", label: "Tarefa", render: (row) => row.task?.funcionalidade || row.atividade || "Tarefa não informada" },
    { key: "periodo", label: "Período", render: (row) => `${dateLabel(row.inicioEm)} a ${dateLabel(row.fimEm)}` },
    { key: "horas", label: "Horas estimadas", render: (row) => row.task ? hours(row.task.estimativaMinutos) : "—" },
    { key: "situacao", label: "Situação", render: (row) => row.project.arquivadoEm ? "Projeto arquivado" : row.line.vinculoAtivo && row.line.recursoAtivo ? "Ativo" : "Vínculo inativo" }
  ], []);

  const totalMinutes = Array.from(new Map(
    rows
      .filter((item) => item.task)
      .map((item) => [`${item.project.id}:${item.line.id}:${item.task.id}`, item.task])
  ).values()).reduce((total, task) => total + Number(task.estimativaMinutos || 0), 0);
  const deleteCount = deleteTarget?.items?.length || 0;

  return <section className="resource-planning-execution">
    {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
    {success && <FeedbackMessage type="success" compact>{success}</FeedbackMessage>}

    <div className="resource-planning-summary">
      <article><span>Planejamentos exibidos</span><strong>{rows.length}</strong></article>
      <article><span>Horas estimadas</span><strong>{hours(totalMinutes)}</strong></article>
      <article><span>Recursos relacionados</span><strong>{new Set(rows.map((row) => row.line.cadastroRecursoId)).size}</strong></article>
      <article><span>Projetos relacionados</span><strong>{new Set(rows.map((row) => row.project.id)).size}</strong></article>
    </div>

    <CrudGrid
      title="Execuções planejadas"
      kicker="Planejamento"
      columns={columns}
      rows={rows}
      selectedId={selection.selectedId}
      selectedIds={selection.selectedIds}
      onSelect={selection.selectRow}
      onToggleSelect={selection.toggleSelected}
      onToggleSelectAll={selection.toggleVisible}
      onCreate={openCreate}
      onEdit={(item) => openExecution(item, "edit")}
      onView={(item) => openExecution(item, "view")}
      onDelete={(ids) => setDeleteTarget({ items: allRows.filter((item) => ids.includes(item.id)) })}
      search={search}
      onSearchChange={setSearch}
      filters={<>
        <label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select></label>
        <label>Recurso<select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="">Todos os recursos</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{userLabel(resource.usuario)}</option>)}</select></label>
      </>}
      emptyMessage={loading ? "Carregando planejamentos..." : "Nenhuma execução planejada encontrada."}
      busy={loading}
      canCreate={panel.permissoes?.podeIncluir && writableLines.some((line) => line.tarefas.some((task) => task.ativo))}
      canEdit={!!selectedEditable && panel.permissoes?.podeAlterar}
      canView={!!selectedExecution}
      canDelete={panel.permissoes?.podeExcluir}
      isRowSelectable={(row) => !row.project.arquivadoEm}
      getRowLabel={(row) => `${row.task?.funcionalidade || row.atividade}, ${userLabel(row.user)}`}
    />

    {editor && <ExecutionEditor
      editor={editor}
      setEditor={setEditor}
      lines={panel.linhas}
      saving={saving}
      onClose={() => setEditor(null)}
      onSubmit={submit}
    />}

    <ConfirmDialog
      open={!!deleteTarget}
      title="Excluir planejamento"
      message={deleteCount === 1 ? "Confirma a exclusão do planejamento selecionado?" : `Confirma a exclusão de ${deleteCount} planejamentos?`}
      confirmLabel="Excluir"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
      loading={saving}
    />
  </section>;
}

function ExecutionEditor({ editor, setEditor, lines, saving, onClose, onSubmit }) {
  const readonly = editor.mode === "view";
  const immutableLink = readonly || Boolean(editor.id);
  const projectOptions = useMemo(() => {
    const values = new Map();
    lines.forEach((line) => {
      if (isWritableLine(line) || line.id === editor.projetoRecursoId) values.set(line.projeto.id, line.projeto);
    });
    return Array.from(values.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [editor.projetoRecursoId, lines]);
  const lineOptions = useMemo(() => lines
    .filter((line) => line.projetoId === editor.projectId && (isWritableLine(line) || line.id === editor.projetoRecursoId))
    .sort((a, b) => userLabel(a.usuario).localeCompare(userLabel(b.usuario))), [editor.projectId, editor.projetoRecursoId, lines]);
  const selectedLine = lines.find((line) => line.id === editor.projetoRecursoId) || null;
  const taskOptions = (selectedLine?.tarefas || [])
    .filter((task) => task.ativo || task.id === editor.tarefaId)
    .slice().sort((a, b) => a.funcionalidade.localeCompare(b.funcionalidade));
  const invalidPeriod = !!editor.inicioEm && !!editor.fimEm && editor.fimEm < editor.inicioEm;
  const invalid = !editor.projectId || !editor.projetoRecursoId || !editor.tarefaId
    || !editor.inicioEm || !editor.fimEm || invalidPeriod;

  const changeProject = (projectId) => {
    const nextLines = lines.filter((line) => line.projetoId === projectId && isWritableLine(line));
    const nextLine = nextLines.length === 1 ? nextLines[0] : null;
    setEditor({
      ...editor,
      projectId,
      projetoRecursoId: nextLine?.id || "",
      tarefaId: nextLine?.tarefas.find((task) => task.ativo)?.id || ""
    });
  };
  const changeLine = (projetoRecursoId) => {
    const nextLine = lines.find((line) => line.id === projetoRecursoId);
    setEditor({
      ...editor,
      projetoRecursoId,
      tarefaId: nextLine?.tarefas.find((task) => task.ativo)?.id || ""
    });
  };

  return <CrudModal
    mode={readonly ? "view" : editor.id ? "edit" : "create"}
    title={readonly ? "Visualizar planejamento" : editor.id ? "Alterar planejamento" : "Incluir planejamento"}
    onClose={onClose}
    onSubmit={readonly ? (event) => event.preventDefault() : onSubmit}
    formClassName="resource-planning-task-form"
    modalClassName="resource-planning-execution-modal"
    actions={readonly
      ? <button type="button" onClick={onClose}>Fechar</button>
      : <><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" disabled={saving || invalid}>{saving ? "Salvando..." : "Salvar"}</button></>}
  >
    <div className="resource-planning-task-grid">
      <label><span>Projeto</span><select required disabled={immutableLink} value={editor.projectId} onChange={(event) => changeProject(event.target.value)}><option value="">Selecione</option>{projectOptions.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select></label>
      <label><span>Recurso</span><select required disabled={immutableLink || !editor.projectId} value={editor.projetoRecursoId} onChange={(event) => changeLine(event.target.value)}><option value="">Selecione</option>{lineOptions.map((line) => <option key={line.id} value={line.id}>{userLabel(line.usuario)}</option>)}</select></label>
      <label className="wide"><span>Tarefa</span><select required disabled={readonly || !selectedLine} value={editor.tarefaId} onChange={(event) => setEditor({ ...editor, tarefaId: event.target.value })}><option value="">Selecione</option>{taskOptions.map((task) => <option key={task.id} value={task.id}>{task.funcionalidade}{task.ativo ? "" : " (inativa)"}</option>)}</select><small>A tarefa precisa estar vinculada ao recurso selecionado.</small></label>
      <label><span>Início previsto</span><input required disabled={readonly} type="date" value={editor.inicioEm} onChange={(event) => setEditor({ ...editor, inicioEm: event.target.value })} /></label>
      <label><span>Fim previsto</span><input required disabled={readonly} type="date" value={editor.fimEm} onChange={(event) => setEditor({ ...editor, fimEm: event.target.value })} /></label>
      {invalidPeriod && <div className="resource-planning-field-error wide" role="alert">O fim previsto não pode ser anterior ao início previsto.</div>}
    </div>
  </CrudModal>;
}
