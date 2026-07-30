import { useCallback, useEffect, useMemo, useState } from "react";
import { excluirRecurso, getRecursos, getRecursosProjetos, salvarRecurso } from "../../services/Projetos/RecursoService";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import "../styles/crudGrid.css";
import "../styles/projectResource.css";

const emptyPanel = { candidatos: [], recursos: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";
const projectLabel = (project) => `${project.chave} — ${project.nome}`;

export default function ProjectResourceManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editor, setEditor] = useState(null);
  const [resourceToView, setResourceToView] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const selectedResource = useMemo(() => panel.recursos.find((item) => item.id === selectedId) || null, [panel.recursos, selectedId]);
  const activeProjects = useMemo(() => projects.filter((item) => !item.arquivadoEm), [projects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, projectOptions] = await Promise.all([getRecursos(), getRecursosProjetos()]);
      setPanel(result || emptyPanel);
      setProjects(projectOptions || []);
      setSelectedId((current) => result?.recursos?.some((item) => item.id === current) ? current : result?.recursos?.[0]?.id || null);
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

  const toggleProject = (projectId) => {
    const selected = editor.projetoIds.includes(projectId);
    setEditor({ ...editor, projetoIds: selected ? editor.projetoIds.filter((id) => id !== projectId) : [...editor.projetoIds, projectId] });
  };

  const submitResource = (event) => {
    event.preventDefault();
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
    void run(() => excluirRecurso({ id: resourceToDelete.id, versao: resourceToDelete.versao }), "Recurso excluído.", () => setResourceToDelete(null));
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
    <header className="crud-grid resource-header">
      <div>
        <span className="workspace-label">Cadastro empresarial</span>
        <h2>Recursos</h2>
        <p>Cadastre o recurso e escolha o projeto diretamente no formulário.</p>
      </div>
    </header>
    {error && <div className="resource-feedback error" role="alert">{error}</div>}
    {success && <div className="resource-feedback success">{success}</div>}
    {!loading && activeProjects.length === 0 && <div className="resource-feedback info">Cadastre um projeto ativo antes de incluir recursos.</div>}
    <CrudGrid
      title="Cadastro de recursos"
      kicker="Recursos"
      columns={columns}
      rows={panel.recursos}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={openCreate}
      onEdit={openEdit}
      onView={(item) => {
        setSelectedId(item.id);
        setResourceToView(item);
      }}
      onDelete={() => selectedResource && setResourceToDelete(selectedResource)}
      emptyMessage={loading ? "Carregando recursos..." : "Nenhum recurso cadastrado."}
      busy={loading}
      canCreate={panel.permissoes?.podeIncluir && availableUsers.length > 0 && activeProjects.length > 0}
      canEdit={!!selectedResource && panel.permissoes?.podeAlterar}
      canView={!!selectedResource}
      canDelete={!!selectedResource && panel.permissoes?.podeExcluir}
      selectedIds={selectedResource ? [selectedResource.id] : []}
      selectable={false}
    />
    {resourceToView && <CrudModal
      mode="view"
      title={userLabel(resourceToView.usuario)}
      ariaLabel="Detalhes do recurso"
      onClose={() => setResourceToView(null)}
      onSubmit={(event) => event.preventDefault()}
      formClassName="resource-view"
      actions={<button type="button" onClick={() => setResourceToView(null)}>Fechar</button>}
    >
      <div className="resource-view-grid">
        <article>
          <span>E-mail</span>
          <strong>{resourceToView.usuario.email}</strong>
        </article>
        <article>
          <span>Situação</span>
          <strong>{resourceToView.ativo ? "Ativo" : "Inativo"}</strong>
        </article>
        <article className="wide">
          <span>Projetos vinculados</span>
          <div className="resource-view-projects">
            {resourceToView.projetos?.filter((item) => item.ativo).length
              ? resourceToView.projetos.filter((item) => item.ativo).map((item) => <strong key={item.id}>{projectLabel(item.projeto)}</strong>)
              : <strong>Nenhum projeto ativo.</strong>}
          </div>
        </article>
      </div>
    </CrudModal>}
    {editor && <CrudModal
      mode={editor.mode === "create" ? "create" : "edit"}
      title={editor.mode === "create" ? "Cadastrar recurso" : "Alterar recurso"}
      onClose={() => setEditor(null)}
      onSubmit={submitResource}
      formClassName="resource-form"
      actions={<>
        <button type="button" className="secondary" onClick={() => setEditor(null)}>Cancelar</button>
        <button type="submit" disabled={saving || !editor.usuarioId || editor.projetoIds.length === 0}>{saving ? "Salvando..." : "Salvar"}</button>
      </>}
    >
      <div className="resource-form-grid">
        <label className="resource-form-user">
          <span>Usuário</span>
          <select required disabled={editor.mode === "edit"} value={editor.usuarioId} onChange={(event) => setEditor({ ...editor, usuarioId: event.target.value })}>
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
                <input type="checkbox" checked={checked} disabled={!!item.arquivadoEm} onChange={() => toggleProject(item.id)} />
                <span><strong>{item.chave}</strong><small>{item.nome}{item.arquivadoEm ? " · Arquivado" : ""}</small></span>
              </label>;
            })}
          </div>
          <small className="resource-project-count">{editor.projetoIds.length === 0 ? "Nenhum projeto selecionado." : `${editor.projetoIds.length} projeto(s) selecionado(s).`}</small>
        </fieldset>
      </div>
      <label className="resource-form-check">
        <input type="checkbox" checked={editor.ativo} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} />
        <span><strong>Recurso ativo</strong><small>Recursos inativos não participam das atividades dos projetos.</small></span>
      </label>
      <p className="resource-form-note">A capacidade e a alocação deste recurso serão definidas separadamente na Grade de capacitação.</p>
    </CrudModal>}
    {resourceToDelete && <CrudModal mode="delete" title="Excluir recurso" onClose={() => setResourceToDelete(null)} onSubmit={confirmDelete} actions={<><button type="button" className="secondary" onClick={() => setResourceToDelete(null)}>Cancelar</button><button type="submit" className="danger" disabled={saving}>Excluir</button></>}><p>Confirma a exclusão de <strong>{userLabel(resourceToDelete.usuario)}</strong>? Os vínculos simples com projetos serão removidos. Tarefas, capacidades, alocações ou custos vinculados devem ser removidos antes.</p></CrudModal>}
  </section>;
}
