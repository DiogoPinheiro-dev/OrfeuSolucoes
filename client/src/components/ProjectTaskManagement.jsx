import { useCallback, useEffect, useMemo, useState } from "react";
import { excluirTarefa, getTarefas, salvarTarefa } from "../../services/Projetos/TarefaService";
import CrudGrid from "./CrudGrid";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import "../styles/crudGrid.css";
import "../styles/projectTask.css";

const emptyPanel = { tarefas: [], recursos: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";
const taskLabel = (task) => task?.funcionalidade || "Tarefa";
const hours = (minutes) => Number(minutes || 0) > 0 ? `${(Number(minutes) / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h` : "Não informado";
const estimatedCost = (minutes, value) => (Number(minutes || 0) / 60) * Number(value || 0);
const currency = (value, moeda) => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda || "BRL" }).format(Number(value || 0)); }
  catch { return `${moeda || "BRL"} ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`; }
};
const dateTime = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export default function ProjectTaskManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editor, setEditor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewTab, setViewTab] = useState("cadastro");
  const [taskToDelete, setTaskToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTarefas();
      setPanel(result || emptyPanel);
      setSelectedId((current) => result?.tarefas?.some((item) => item.id === current) ? current : result?.tarefas?.[0]?.id || null);
    } catch (loadError) {
      setError(loadError.message);
      setPanel(emptyPanel);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedTask = useMemo(() => panel.tarefas.find((item) => item.id === selectedId) || null, [panel.tarefas, selectedId]);
  const viewTask = useMemo(() => panel.tarefas.find((item) => item.id === viewId) || null, [panel.tarefas, viewId]);
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return panel.tarefas.filter((item) => {
      const matchesSearch = !term || [userLabel(item.recurso.usuario), item.recurso.usuario.email, item.funcionalidade, item.observacao].some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(term));
      return matchesSearch && (!resourceFilter || item.recursoId === resourceFilter);
    });
  }, [panel.tarefas, resourceFilter, search]);

  const hasActiveResource = useMemo(() => panel.recursos.some((resource) => resource.ativo), [panel.recursos]);

  const openCreate = () => {
    setEditor({ mode: "create", activeTab: "cadastro", recursoId: "", funcionalidade: "", estimativaHoras: "", valorHora: "", moeda: "BRL", observacao: "", ativo: true });
  };
  const openEdit = (task) => setEditor({ mode: "edit", activeTab: "cadastro", id: task.id, versao: task.versao, recursoId: task.recursoId, funcionalidade: task.funcionalidade, estimativaHoras: task.estimativaMinutos > 0 ? String(Number(task.estimativaMinutos) / 60) : "", valorHora: String(Number(task.valorHora)), moeda: task.moeda, observacao: task.observacao || "", ativo: task.ativo });
  const openView = (task) => {
    setSelectedId(task.id);
    setViewId(task.id);
    setViewTab("cadastro");
  };

  const run = async (operation, message, reset) => {
    setSaving(true); setError(""); setSuccess("");
    try { await operation(); reset?.(); setSuccess(message); await load(); }
    catch (operationError) { setError(operationError.message); }
    finally { setSaving(false); }
  };

  const submit = (event) => {
    event.preventDefault();
    const value = Number(editor.valorHora);
    const input = {
      recursoId: editor.recursoId,
      funcionalidade: editor.funcionalidade.trim(),
      estimativaMinutos: Math.round(Number(editor.estimativaHoras) * 60),
      valorHora: value.toFixed(4),
      moeda: editor.moeda.trim().toUpperCase(),
      observacao: editor.observacao.trim() || null,
      ativo: editor.ativo,
      ...(editor.id ? { id: editor.id, versao: editor.versao } : {})
    };
    void run(() => salvarTarefa(input), editor.id ? "Tarefa alterada." : "Tarefa cadastrada.", () => setEditor(null));
  };
  const confirmDelete = (event) => {
    event.preventDefault();
    void run(() => excluirTarefa({ id: taskToDelete.id, versao: taskToDelete.versao }), "Tarefa excluída.", () => setTaskToDelete(null));
  };

  const columns = useMemo(() => [
    { key: "recurso", label: "Recurso", render: (row) => userLabel(row.recurso.usuario) },
    { key: "funcionalidade", label: "Funcionalidade" },
    { key: "estimativa", label: "Horas estimadas", render: (row) => hours(row.estimativaMinutos) },
    { key: "valorHora", label: "Valor/hora", render: (row) => currency(row.valorHora, row.moeda) },
    { key: "custoEstimado", label: "Custo estimado", render: (row) => currency(estimatedCost(row.estimativaMinutos, row.valorHora), row.moeda) },
    { key: "ativo", label: "Situação", render: (row) => row.ativo ? "Ativa" : "Inativa" }
  ], []);

  return <section className="project-task">
    <header className="crud-grid task-header"><div><span className="workspace-label">Cadastro empresarial</span><h2>Tarefas</h2><p>Descreva a execução, estime o esforço e registre o valor cobrado por hora.</p></div></header>
    {error && <div className="task-feedback error" role="alert">{error}</div>}
    {success && <div className="task-feedback success" role="status">{success}</div>}
    <CrudGrid title="Cadastro de tarefas" kicker="Tarefas" columns={columns} rows={rows} selectedId={selectedId} onSelect={setSelectedId} onCreate={openCreate} onEdit={openEdit} onView={openView} onDelete={() => selectedTask && setTaskToDelete(selectedTask)} search={search} onSearchChange={setSearch} filters={<label>Recurso<select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="">Todos os recursos</option>{panel.recursos.map((item) => <option key={item.id} value={item.id}>{userLabel(item.usuario)}</option>)}</select></label>} emptyMessage={loading ? "Carregando tarefas..." : "Nenhuma tarefa encontrada."} busy={loading} canCreate={panel.permissoes?.podeIncluir && hasActiveResource} canEdit={!!selectedTask && panel.permissoes?.podeAlterar} canView={!!selectedTask} canDelete={!!selectedTask && panel.permissoes?.podeExcluir} selectedIds={selectedTask ? [selectedTask.id] : []} selectable={false} />
    {editor && <CrudModal
      mode={editor.mode === "create" ? "create" : "edit"}
      title={editor.mode === "create" ? "Cadastrar tarefa" : "Alterar tarefa"}
      onClose={() => setEditor(null)}
      onSubmit={submit}
      formClassName="task-form"
      modalClassName="task-registration-modal"
      actions={<><button type="button" className="secondary" onClick={() => setEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !editor.recursoId || !editor.funcionalidade.trim() || Number(editor.estimativaHoras) <= 0 || Number(editor.valorHora) <= 0 || !/^[A-Z]{3}$/.test(editor.moeda.trim().toUpperCase())}>{saving ? "Salvando..." : "Salvar"}</button></>}
    >
      <CrudModalTabs tabs={[{ id: "cadastro", label: "Cadastro" }, { id: "planejamento", label: "Planejamento" }]} activeTab={editor.activeTab} onChange={(activeTab) => setEditor({ ...editor, activeTab })} />
      <CrudModalTabPanel active={editor.activeTab === "cadastro"}>
        <div className="task-form-grid">
          <label><span>Recurso</span><select required disabled={editor.mode === "edit"} value={editor.recursoId} onChange={(event) => setEditor({ ...editor, recursoId: event.target.value })}><option value="">Selecione</option>{panel.recursos.filter((item) => item.ativo || item.id === editor.recursoId).map((item) => <option key={item.id} value={item.id}>{userLabel(item.usuario)}</option>)}</select><small>Pessoa responsável pela execução.</small></label>
          <label className="wide"><span>Funcionalidade</span><textarea required maxLength={500} rows={4} value={editor.funcionalidade} onChange={(event) => setEditor({ ...editor, funcionalidade: event.target.value })} placeholder="Descreva o que esta tarefa faz" /><small>Descrição livre da atividade que o recurso executará.</small></label>
          <label className="task-active wide"><input type="checkbox" checked={editor.ativo} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} /><span><strong>Tarefa ativa</strong><small>Tarefas inativas permanecem no histórico, mas não devem ser usadas em novos planejamentos.</small></span></label>
        </div>
      </CrudModalTabPanel>
      <CrudModalTabPanel active={editor.activeTab === "planejamento"}>
        <div className="task-planning-fields">
          <label><span>Horas estimadas</span><input required type="number" min="0.01" step="0.01" value={editor.estimativaHoras} onChange={(event) => setEditor({ ...editor, estimativaHoras: event.target.value })} placeholder="0,00" /><small>Tempo previsto para concluir a tarefa.</small></label>
          <label><span>Valor cobrado por hora</span><input required type="number" min="0.01" step="0.01" value={editor.valorHora} onChange={(event) => setEditor({ ...editor, valorHora: event.target.value })} placeholder="0,00" /><small>Taxa utilizada no cálculo do custo estimado.</small></label>
          <label><span>Moeda</span><input required maxLength={3} value={editor.moeda} onChange={(event) => setEditor({ ...editor, moeda: event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) })} placeholder="BRL" /><small>Código monetário de três letras.</small></label>
          <label className="wide"><span>Observação</span><textarea maxLength={500} rows={4} value={editor.observacao} onChange={(event) => setEditor({ ...editor, observacao: event.target.value })} placeholder="Detalhes, nível de especialidade ou condições comerciais" /></label>
        </div>
        <div className="task-estimate-preview"><span>Custo estimado da tarefa</span><strong>{currency(estimatedCost(Math.round(Number(editor.estimativaHoras || 0) * 60), editor.valorHora), editor.moeda)}</strong><small>Estimativa calculada pelas horas previstas multiplicadas pelo valor por hora.</small></div>
      </CrudModalTabPanel>
    </CrudModal>}
    {viewTask && <CrudModal
      mode="view"
      title={taskLabel(viewTask)}
      ariaLabel="Visualizar tarefa"
      onClose={() => setViewId(null)}
      onSubmit={(event) => event.preventDefault()}
      formClassName="task-view-form"
      modalClassName="task-registration-modal"
      actions={<button type="button" onClick={() => setViewId(null)}>Fechar</button>}
    >
      <CrudModalTabs tabs={[{ id: "cadastro", label: "Cadastro" }, { id: "planejamento", label: "Planejamento" }]} activeTab={viewTab} onChange={setViewTab} />
      <CrudModalTabPanel active={viewTab === "cadastro"}>
        <div className="task-view-grid">
          <article><span>Recurso</span><strong>{userLabel(viewTask.recurso.usuario)}</strong></article>
          <article><span>Situação</span><strong>{viewTask.ativo ? "Ativa" : "Inativa"}</strong></article>
          <article className="wide"><span>Funcionalidade</span><strong>{viewTask.funcionalidade}</strong></article>
        </div>
      </CrudModalTabPanel>
      <CrudModalTabPanel active={viewTab === "planejamento"}>
        <div className="task-planning-summary">
          <article><span>Horas estimadas</span><strong>{hours(viewTask.estimativaMinutos)}</strong></article>
          <article><span>Valor por hora</span><strong>{currency(viewTask.valorHora, viewTask.moeda)}</strong></article>
          <article><span>Custo estimado</span><strong>{currency(estimatedCost(viewTask.estimativaMinutos, viewTask.valorHora), viewTask.moeda)}</strong></article>
        </div>
        <div className="task-observation"><span>Observação</span><strong>{viewTask.observacao || "Nenhuma observação informada."}</strong></div>
        <section className="task-history"><h4>Histórico de valores</h4>{viewTask.taxas?.length ? <div className="crud-table-wrap"><table className="crud-table task-history-table"><thead><tr><th>Valor por hora</th><th>Moeda</th><th>Alterado em</th><th>Alterado por</th></tr></thead><tbody>{viewTask.taxas.map((taxa) => <tr key={taxa.id}><td>{currency(taxa.valorHora, taxa.moeda)}</td><td>{taxa.moeda}</td><td>{dateTime(taxa.criadoEm)}</td><td>{userLabel(taxa.criadoPor)}</td></tr>)}</tbody></table></div> : <div className="task-history-empty">Nenhuma alteração de valor registrada.</div>}</section>
      </CrudModalTabPanel>
    </CrudModal>}
    {taskToDelete && <CrudModal mode="delete" title="Excluir tarefa" onClose={() => setTaskToDelete(null)} onSubmit={confirmDelete} actions={<><button type="button" className="secondary" onClick={() => setTaskToDelete(null)}>Cancelar</button><button type="submit" className="danger" disabled={saving}>Excluir</button></>}><p>Confirma a exclusão da tarefa <strong>{taskLabel(taskToDelete)}</strong> do recurso <strong>{userLabel(taskToDelete.recurso.usuario)}</strong>?</p></CrudModal>}
  </section>;
}
