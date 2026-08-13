import { useCallback, useEffect, useMemo, useState } from "react";
import { excluirRecurso, getRecursos, getRecursosProjetos, salvarRecurso } from "../../services/Projetos/RecursoService";
import { useCrudSelection } from "../hooks/useCrudSelection";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import { FeedbackMessage } from "./CrudFeedback";
import "../styles/crudGrid.css";
import "../styles/projectResource.css";

const emptyPanel = { candidatos: [], recursos: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";

export default function ProjectResourceManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editor, setEditor] = useState(null);
  const [resourcesToDelete, setResourcesToDelete] = useState([]);
  const activeProjects = useMemo(() => projects.filter((item) => !item.arquivadoEm), [projects]);
  const filteredResources = useMemo(() => panel.recursos.filter((resource) =>
    !projectFilter || resource.projetos?.some((item) => item.ativo && item.projetoId === projectFilter)
  ), [panel.recursos, projectFilter]);
  const selection = useCrudSelection(filteredResources);
  const selectedResource = useMemo(() => filteredResources.find((item) => item.id === selection.selectedId) || null, [filteredResources, selection.selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, projectOptions] = await Promise.all([getRecursos(), getRecursosProjetos()]);
      setPanel(result || emptyPanel);
      setProjects(projectOptions || []);
    } catch (loadError) {
      setError(loadError.message);
      setPanel(emptyPanel);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

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

  const availableUsers = useMemo(
    () => panel.candidatos.filter((candidate) => !panel.recursos.some((resource) => resource.usuarioId === candidate.id && resource.id !== editor?.id)),
    [panel.candidatos, panel.recursos, editor?.id]
  );

  const openCreate = () => setEditor({
    mode: "create",
    usuarioId: availableUsers[0]?.id || "",
    projetoIds: [],
    ativo: true
  });

  const openEdit = (resource) => {
    setEditor({
      mode: "edit",
      id: resource.id,
      versao: resource.versao,
      usuarioId: resource.usuarioId,
      projetoIds: resource.projetos?.filter((item) => item.ativo).map((item) => item.projetoId) || [],
      ativo: resource.ativo
    });
  };

  const openView = (resource) => {
    selection.selectRow(resource.id);
    setEditor({
      mode: "view",
      id: resource.id,
      versao: resource.versao,
      usuarioId: resource.usuarioId,
      projetoIds: resource.projetos?.filter((item) => item.ativo).map((item) => item.projetoId) || [],
      ativo: resource.ativo
    });
  };

  const toggleProject = (projectId) => {
    const selected = editor.projetoIds.includes(projectId);
    if (editor.mode === "view") return;
    setEditor({ ...editor, projetoIds: selected ? editor.projetoIds.filter((id) => id !== projectId) : [...editor.projetoIds, projectId] });
  };

  const submitResource = (event) => {
    event.preventDefault();
    if (editor.mode === "view") return;
    const input = {
      usuarioId: editor.usuarioId,
      projetoIds: editor.projetoIds,
      ativo: editor.ativo,
      ...(editor.id ? { id: editor.id, versao: editor.versao } : {})
    };
    void run(() => salvarRecurso(input), editor.id ? "Recurso alterado." : "Recurso cadastrado.", () => setEditor(null));
  };

  const confirmDelete = (event) => {
    event.preventDefault();
    if (!resourcesToDelete.length) return;
    const quantidade = resourcesToDelete.length;
    void run(
      () => Promise.all(resourcesToDelete.map((resource) => excluirRecurso({ id: resource.id, versao: resource.versao }))),
      quantidade === 1 ? "Recurso excluído." : quantidade + " recursos excluídos.",
      () => { setResourcesToDelete([]); selection.resetSelection(); }
    );
  };

  const columns = useMemo(() => [
    { key: "usuario", label: "Recurso", render: (row) => userLabel(row.usuario) },
    { key: "email", label: "E-mail", render: (row) => row.usuario.email },
    {
      key: "projetos",
      label: "Projetos ativos",
      render: (row) => row.projetos?.filter((item) => item.ativo).map((item) => item.projeto.chave).join(", ") || "—"
    },
    { key: "ativo", label: "Situação", render: (row) => row.ativo ? "Ativo" : "Inativo" }
  ], []);

  return <section className="project-resource">
    {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
    {success && <FeedbackMessage type="success" compact>{success}</FeedbackMessage>}
    {!loading && activeProjects.length === 0 && <FeedbackMessage type="info" compact>Cadastre um projeto ativo antes de incluir recursos.</FeedbackMessage>}
    <CrudGrid
      title="Cadastro de recursos"
      kicker="Recursos"
      columns={columns}
      rows={filteredResources}
      selectedId={selection.selectedId}
      selectedIds={selection.selectedIds}
      onSelect={selection.selectRow}
      onToggleSelect={selection.toggleSelected}
      onToggleSelectAll={selection.toggleVisible}
      onCreate={openCreate}
      onEdit={openEdit}
      onView={openView}
      onDelete={(ids) => setResourcesToDelete(panel.recursos.filter((resource) => ids.includes(resource.id)))}
      filters={<label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}{project.arquivadoEm ? " (arquivado)" : ""}</option>)}</select></label>}
      emptyMessage={loading ? "Carregando recursos..." : projectFilter ? "Nenhum recurso vinculado ao projeto selecionado." : "Nenhum recurso cadastrado."}
      busy={loading}
      canCreate={panel.permissoes?.podeIncluir && availableUsers.length > 0 && activeProjects.length > 0}
      canEdit={!!selectedResource && panel.permissoes?.podeAlterar}
      canView={!!selectedResource}
      canDelete={panel.permissoes?.podeExcluir}
      isRowSelectable={() => panel.permissoes?.podeExcluir === true}
      getRowLabel={(resource) => userLabel(resource.usuario)}
    />
    {editor && <CrudModal
      mode={editor.mode}
      title={editor.mode === "create" ? "Cadastrar recurso" : editor.mode === "view" ? "Visualizar recurso" : "Alterar recurso"}
      ariaLabel={editor.mode === "view" ? "Visualizar recurso" : undefined}
      onClose={() => setEditor(null)}
      onSubmit={submitResource}
      formClassName="resource-form"
      actions={editor.mode === "view"
        ? <button type="button" onClick={() => setEditor(null)}>Fechar</button>
        : <><button type="button" className="secondary" onClick={() => setEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !editor.usuarioId || editor.projetoIds.length === 0}>{saving ? "Salvando..." : "Salvar"}</button></>}
    >
      <div className="resource-form-grid">
        <label className="resource-form-user">
          <span>Usuário</span>
          <select required disabled={editor.mode !== "create"} value={editor.usuarioId} onChange={(event) => setEditor({ ...editor, usuarioId: event.target.value })}>
            <option value="">Selecione</option>
            {availableUsers.map((item) => <option key={item.id} value={item.id}>{userLabel(item)} — {item.email}</option>)}
          </select>
          <small>A pessoa que será cadastrada como recurso.</small>
        </label>
        <fieldset className="resource-project-picker">
          <legend>Projetos</legend>
          <p>Selecione um ou mais projetos para vincular ao recurso.</p>
          <div className="resource-project-options">
            {projects.map((item) => {
              const checked = editor.projetoIds.includes(item.id);
              return <label key={item.id} className={`resource-project-option${checked ? " selected" : ""}${item.arquivadoEm ? " disabled" : ""}`}>
                <input type="checkbox" checked={checked} disabled={editor.mode === "view" || !!item.arquivadoEm} onChange={() => toggleProject(item.id)} />
                <span><strong>{item.chave}</strong><small>{item.nome}{item.arquivadoEm ? " · Arquivado" : ""}</small></span>
              </label>;
            })}
          </div>
          <small className="resource-project-count">{editor.projetoIds.length === 0 ? "Nenhum projeto selecionado." : `${editor.projetoIds.length} projeto(s) selecionado(s).`}</small>
        </fieldset>
      </div>
      <label className="resource-planning-check">
        <input type="checkbox" checked={editor.ativo} disabled={editor.mode === "view"} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} />
        <span><strong>Recurso ativo</strong><small>Recursos inativos não participam das atividades dos projetos.</small></span>
      </label>
      <p className="resource-form-note">As tarefas deste recurso serão vinculadas na aba Tarefas do Planejamento de recursos.</p>
    </CrudModal>}
    {resourcesToDelete.length > 0 && <CrudModal mode="delete" title={resourcesToDelete.length === 1 ? "Excluir recurso" : "Excluir recursos"} onClose={() => setResourcesToDelete([])} onSubmit={confirmDelete} actions={<><button type="button" className="secondary" onClick={() => setResourcesToDelete([])}>Cancelar</button><button type="submit" className="danger" disabled={saving}>Excluir</button></>}><p>{resourcesToDelete.length === 1 ? <>Confirma a exclusão de <strong>{userLabel(resourcesToDelete[0].usuario)}</strong>?</> : <>Confirma a exclusão de <strong>{resourcesToDelete.length} recursos selecionados</strong>?</>} Os vínculos simples com projetos serão removidos. Tarefas, execuções ou custos vinculados devem ser removidos antes.</p></CrudModal>}
  </section>;
}
