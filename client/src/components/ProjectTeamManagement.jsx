import { useCallback, useEffect, useMemo, useState } from "react";
import { excluirEquipe, getProjetoOrganizacao, salvarEquipe } from "../../services/Projetos/OrganizacaoProjetoService";
import { useCrudSelection } from "../hooks/useCrudSelection";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import { FeedbackMessage } from "./CrudFeedback";
import "../styles/projectResource.css";

const emptyPanel = { equipes: [], recursos: [], projetos: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";

export default function ProjectTeamManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const selection = useCrudSelection(panel.equipes);
  const selectedTeam = useMemo(() => panel.equipes.find((item) => item.id === selection.selectedId) || null, [panel.equipes, selection.selectedId]);
  const activeResources = panel.recursos.filter((item) => item.ativo);
  const activeProjects = panel.projetos.filter((item) => !item.arquivadoEm);

  const load = useCallback(async () => { setLoading(true); setError(""); try { setPanel(await getProjetoOrganizacao() || emptyPanel); } catch (loadError) { setError(loadError.message); setPanel(emptyPanel); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const run = async (operation, message, close) => { setSaving(true); setError(""); setSuccess(""); try { await operation(); close?.(); setSuccess(message); await load(); } catch (operationError) { setError(operationError.message); } finally { setSaving(false); } };
  const open = (mode, team = null) => setEditor({ mode, id: team?.id, versao: team?.versao, nome: team?.nome || "", descricao: team?.descricao || "", ativo: team?.ativo ?? true, recursoIds: team?.recursos?.map((item) => item.id) || [], projetoIds: team?.projetos?.map((item) => item.id) || [] });
  const toggle = (field, id) => setEditor((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((item) => item !== id) : [...current[field], id] }));
  const submit = (event) => { event.preventDefault(); if (editor.mode === "view") return; void run(() => salvarEquipe({ ...(editor.id ? { id: editor.id, versao: editor.versao } : {}), nome: editor.nome.trim(), descricao: editor.descricao.trim() || null, ativo: editor.ativo, recursoIds: editor.recursoIds, projetoIds: editor.projetoIds }), editor.id ? "Equipe alterada." : "Equipe cadastrada.", () => setEditor(null)); };
  const confirmDelete = (event) => { event.preventDefault(); void run(() => Promise.all(deleteTarget.map((item) => excluirEquipe({ id: item.id, versao: item.versao }))), "Equipe(s) excluída(s).", () => setDeleteTarget(null)); };

  return <section className="project-resource">
    {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
    {success && <FeedbackMessage type="success" compact>{success}</FeedbackMessage>}
    <CrudGrid title="Cadastro de equipes" kicker="Equipes" columns={[
      { key: "nome", label: "Equipe" },
      { key: "recursos", label: "Recursos", render: (row) => row.recursos?.map((item) => userLabel(item.usuario)).join(", ") || "Nenhum recurso" },
      { key: "projetos", label: "Projetos", render: (row) => row.projetos?.map((item) => item.chave).join(", ") || "Nenhum projeto" },
      { key: "ativo", label: "Situação", render: (row) => row.ativo ? "Ativa" : "Inativa" }
    ]} rows={panel.equipes} selectedId={selection.selectedId} selectedIds={selection.selectedIds} onSelect={selection.selectRow} onToggleSelect={selection.toggleSelected} onToggleSelectAll={selection.toggleVisible} onCreate={() => open("create")} onEdit={(row) => open("edit", row)} onView={(row) => open("view", row)} onDelete={(ids) => setDeleteTarget(panel.equipes.filter((item) => ids.includes(item.id)))} busy={loading} emptyMessage="Nenhuma equipe cadastrada." canCreate={panel.permissoes?.podeIncluir} canEdit={!!selectedTeam && panel.permissoes?.podeAlterar} canView={!!selectedTeam} canDelete={panel.permissoes?.podeExcluir} getRowLabel={(row) => row.nome} />
    {editor && <CrudModal mode={editor.mode} title={editor.mode === "create" ? "Cadastrar equipe" : editor.mode === "view" ? "Visualizar equipe" : "Alterar equipe"} onClose={() => setEditor(null)} onSubmit={submit} formClassName="resource-form" actions={editor.mode === "view" ? <button type="button" onClick={() => setEditor(null)}>Fechar</button> : <><button type="button" className="secondary" onClick={() => setEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !editor.nome.trim()}>{saving ? "Salvando..." : "Salvar"}</button></>}>
      <div className="resource-form-grid"><label><span>Nome</span><input required maxLength={120} disabled={editor.mode === "view"} value={editor.nome} onChange={(event) => setEditor({ ...editor, nome: event.target.value })} /></label><label className="wide"><span>Descrição</span><textarea maxLength={500} rows={3} disabled={editor.mode === "view"} value={editor.descricao} onChange={(event) => setEditor({ ...editor, descricao: event.target.value })} /></label></div>
      <fieldset className="resource-project-picker"><legend>Recursos</legend><p>Selecione os recursos que compõem a equipe.</p><div className="resource-project-options">{activeResources.map((item) => <label key={item.id} className={`resource-project-option${editor.recursoIds.includes(item.id) ? " selected" : ""}`}><input type="checkbox" checked={editor.recursoIds.includes(item.id)} disabled={editor.mode === "view"} onChange={() => toggle("recursoIds", item.id)} /><span><strong>{userLabel(item.usuario)}</strong><small>{item.capacitacao?.nome || "Sem capacitação"}</small></span></label>)}</div>{!activeResources.length && <small>Nenhum recurso ativo disponível.</small>}</fieldset>
      <fieldset className="resource-project-picker"><legend>Projetos</legend><p>Selecione os projetos atendidos pela equipe.</p><div className="resource-project-options">{activeProjects.map((item) => <label key={item.id} className={`resource-project-option${editor.projetoIds.includes(item.id) ? " selected" : ""}`}><input type="checkbox" checked={editor.projetoIds.includes(item.id)} disabled={editor.mode === "view"} onChange={() => toggle("projetoIds", item.id)} /><span><strong>{item.chave}</strong><small>{item.nome}</small></span></label>)}</div>{!activeProjects.length && <small>Nenhum projeto ativo disponível.</small>}</fieldset>
      <label className="resource-planning-check"><input type="checkbox" checked={editor.ativo} disabled={editor.mode === "view"} onChange={(event) => setEditor({ ...editor, ativo: event.target.checked })} /><span><strong>Equipe ativa</strong><small>Equipes inativas mantêm seus vínculos para consulta.</small></span></label>
    </CrudModal>}
    {deleteTarget && <CrudModal mode="delete" title="Excluir equipe" onClose={() => setDeleteTarget(null)} onSubmit={confirmDelete} actions={<><button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="submit" className="danger" disabled={saving}>Excluir</button></>}><p>Confirma a exclusão de <strong>{deleteTarget.length} equipe(s)</strong>?</p></CrudModal>}
  </section>;
}
