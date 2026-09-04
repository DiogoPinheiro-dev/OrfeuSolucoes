import { useCallback, useEffect, useMemo, useState } from "react";
import { excluirRecurso, salvarRecurso } from "../../services/Projetos/RecursoService";
import { excluirCapacitacao, getProjetoOrganizacao, salvarCapacitacao } from "../../services/Projetos/OrganizacaoProjetoService";
import { useCrudSelection } from "../hooks/useCrudSelection";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import { FeedbackMessage } from "./CrudFeedback";
import "../styles/crudGrid.css";
import "../styles/projectResource.css";

const emptyPanel = { candidatos: [], capacitacoes: [], recursos: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";

export default function ResourceRegistrationManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resourceEditor, setResourceEditor] = useState(null);
  const [capabilityEditor, setCapabilityEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const resourceSelection = useCrudSelection(panel.recursos);
  const capabilitySelection = useCrudSelection(panel.capacitacoes);
  const selectedResource = panel.recursos.find((item) => item.id === resourceSelection.selectedId) || null;
  const selectedCapability = panel.capacitacoes.find((item) => item.id === capabilitySelection.selectedId) || null;
  const availableUsers = useMemo(() => panel.candidatos.filter((candidate) => !panel.recursos.some((resource) => resource.usuarioId === candidate.id && resource.id !== resourceEditor?.id)), [panel.candidatos, panel.recursos, resourceEditor?.id]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setPanel(await getProjetoOrganizacao() || emptyPanel); }
    catch (loadError) { setError(loadError.message); setPanel(emptyPanel); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (operation, message, close) => {
    setSaving(true); setError(""); setSuccess("");
    try { await operation(); close?.(); setSuccess(message); await load(); }
    catch (operationError) { setError(operationError.message); }
    finally { setSaving(false); }
  };

  const openResource = (mode, resource = null) => setResourceEditor({ mode, id: resource?.id, versao: resource?.versao, usuarioId: resource?.usuarioId || availableUsers[0]?.id || "", capacitacaoId: resource?.capacitacao?.id || "", ativo: resource?.ativo ?? true });
  const openCapability = (mode, capability = null) => setCapabilityEditor({ mode, id: capability?.id, versao: capability?.versao, nome: capability?.nome || "", descricao: capability?.descricao || "", nivelHierarquico: capability?.nivelHierarquico || 1, ativo: capability?.ativo ?? true });
  const submitResource = (event) => { event.preventDefault(); if (resourceEditor.mode === "view") return; void run(() => salvarRecurso({ ...(resourceEditor.id ? { id: resourceEditor.id, versao: resourceEditor.versao } : {}), usuarioId: resourceEditor.usuarioId, capacitacaoId: resourceEditor.capacitacaoId || null, ativo: resourceEditor.ativo }), resourceEditor.id ? "Recurso alterado." : "Recurso cadastrado.", () => setResourceEditor(null)); };
  const submitCapability = (event) => { event.preventDefault(); if (capabilityEditor.mode === "view") return; void run(() => salvarCapacitacao({ ...(capabilityEditor.id ? { id: capabilityEditor.id, versao: capabilityEditor.versao } : {}), nome: capabilityEditor.nome.trim(), descricao: capabilityEditor.descricao.trim() || null, nivelHierarquico: Number(capabilityEditor.nivelHierarquico), ativo: capabilityEditor.ativo }), capabilityEditor.id ? "Capacitação alterada." : "Capacitação cadastrada.", () => setCapabilityEditor(null)); };
  const confirmDelete = (event) => { event.preventDefault(); const target = deleteTarget; if (!target) return; void run(() => Promise.all(target.items.map((item) => target.kind === "resource" ? excluirRecurso({ id: item.id, versao: item.versao }) : excluirCapacitacao({ id: item.id, versao: item.versao }))), target.kind === "resource" ? "Recurso(s) excluído(s)." : "Capacitação(ões) excluída(s).", () => setDeleteTarget(null)); };

  return <section className="project-resource crud-grid-stack project-resource-grid">
    {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
    {success && <FeedbackMessage type="success" compact>{success}</FeedbackMessage>}
    <CrudGrid title="Cadastro de recursos" kicker="Recursos" columns={[
      { key: "usuario", label: "Recurso", render: (row) => userLabel(row.usuario) },
      { key: "email", label: "E-mail", render: (row) => row.usuario.email },
      { key: "capacitacao", label: "Capacitação", render: (row) => row.capacitacao?.nome || "Não informada" },
      { key: "ativo", label: "Situação", render: (row) => row.ativo ? "Ativo" : "Inativo" }
    ]} rows={panel.recursos} selectedId={resourceSelection.selectedId} selectedIds={resourceSelection.selectedIds} onSelect={resourceSelection.selectRow} onToggleSelect={resourceSelection.toggleSelected} onToggleSelectAll={resourceSelection.toggleVisible} onCreate={() => openResource("create")} onEdit={(row) => openResource("edit", row)} onView={(row) => openResource("view", row)} onDelete={(ids) => setDeleteTarget({ kind: "resource", items: panel.recursos.filter((item) => ids.includes(item.id)) })} busy={loading} emptyMessage="Nenhum recurso cadastrado." canCreate={panel.permissoes?.podeIncluir && availableUsers.length > 0} canEdit={!!selectedResource && panel.permissoes?.podeAlterar} canView={!!selectedResource} canDelete={panel.permissoes?.podeExcluir} getRowLabel={(row) => userLabel(row.usuario)} />
    <CrudGrid title="Grade de capacitações" kicker="Níveis da empresa" columns={[
      { key: "nome", label: "Capacitação" }, { key: "nivelHierarquico", label: "Nível hierárquico" },
      { key: "descricao", label: "Descrição", render: (row) => row.descricao || "—" },
      { key: "ativo", label: "Situação", render: (row) => row.ativo ? "Ativa" : "Inativa" }
    ]} rows={panel.capacitacoes} selectedId={capabilitySelection.selectedId} selectedIds={capabilitySelection.selectedIds} onSelect={capabilitySelection.selectRow} onToggleSelect={capabilitySelection.toggleSelected} onToggleSelectAll={capabilitySelection.toggleVisible} onCreate={() => openCapability("create")} onEdit={(row) => openCapability("edit", row)} onView={(row) => openCapability("view", row)} onDelete={(ids) => setDeleteTarget({ kind: "capability", items: panel.capacitacoes.filter((item) => ids.includes(item.id)) })} busy={loading} emptyMessage="Nenhuma capacitação cadastrada." canCreate={panel.permissoes?.podeIncluir} canEdit={!!selectedCapability && panel.permissoes?.podeAlterar} canView={!!selectedCapability} canDelete={panel.permissoes?.podeExcluir} getRowLabel={(row) => row.nome} />

    {resourceEditor && <CrudModal mode={resourceEditor.mode} title={resourceEditor.mode === "create" ? "Cadastrar recurso" : resourceEditor.mode === "view" ? "Visualizar recurso" : "Alterar recurso"} onClose={() => setResourceEditor(null)} onSubmit={submitResource} formClassName="resource-form" actions={resourceEditor.mode === "view" ? <button type="button" onClick={() => setResourceEditor(null)}>Fechar</button> : <><button type="button" className="secondary" onClick={() => setResourceEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !resourceEditor.usuarioId}>{saving ? "Salvando..." : "Salvar"}</button></>}><div className="resource-form-grid"><label><span>Usuário</span><select required disabled={resourceEditor.mode !== "create"} value={resourceEditor.usuarioId} onChange={(event) => setResourceEditor({ ...resourceEditor, usuarioId: event.target.value })}><option value="">Selecione</option>{availableUsers.map((item) => <option key={item.id} value={item.id}>{userLabel(item)} — {item.email}</option>)}</select></label><label><span>Capacitação</span><select disabled={resourceEditor.mode === "view"} value={resourceEditor.capacitacaoId} onChange={(event) => setResourceEditor({ ...resourceEditor, capacitacaoId: event.target.value })}><option value="">Não informada</option>{panel.capacitacoes.filter((item) => item.ativo || item.id === resourceEditor.capacitacaoId).map((item) => <option key={item.id} value={item.id}>{item.nome} · nível {item.nivelHierarquico}</option>)}</select></label></div><label className="resource-planning-check"><input type="checkbox" checked={resourceEditor.ativo} disabled={resourceEditor.mode === "view"} onChange={(event) => setResourceEditor({ ...resourceEditor, ativo: event.target.checked })} /><span><strong>Recurso ativo</strong><small>O vínculo com projetos será realizado por meio das equipes.</small></span></label></CrudModal>}
    {capabilityEditor && <CrudModal mode={capabilityEditor.mode} title={capabilityEditor.mode === "create" ? "Cadastrar capacitação" : capabilityEditor.mode === "view" ? "Visualizar capacitação" : "Alterar capacitação"} onClose={() => setCapabilityEditor(null)} onSubmit={submitCapability} formClassName="resource-form" actions={capabilityEditor.mode === "view" ? <button type="button" onClick={() => setCapabilityEditor(null)}>Fechar</button> : <><button type="button" className="secondary" onClick={() => setCapabilityEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !capabilityEditor.nome.trim() || Number(capabilityEditor.nivelHierarquico) < 1}>{saving ? "Salvando..." : "Salvar"}</button></>}><div className="resource-form-grid"><label><span>Nome</span><input required maxLength={120} disabled={capabilityEditor.mode === "view"} value={capabilityEditor.nome} onChange={(event) => setCapabilityEditor({ ...capabilityEditor, nome: event.target.value })} /></label><label><span>Nível hierárquico</span><input required type="number" min="1" disabled={capabilityEditor.mode === "view"} value={capabilityEditor.nivelHierarquico} onChange={(event) => setCapabilityEditor({ ...capabilityEditor, nivelHierarquico: event.target.value })} /><small>Números maiores representam níveis superiores.</small></label><label className="wide"><span>Descrição</span><textarea maxLength={500} rows={3} disabled={capabilityEditor.mode === "view"} value={capabilityEditor.descricao} onChange={(event) => setCapabilityEditor({ ...capabilityEditor, descricao: event.target.value })} /></label></div><label className="resource-planning-check"><input type="checkbox" checked={capabilityEditor.ativo} disabled={capabilityEditor.mode === "view"} onChange={(event) => setCapabilityEditor({ ...capabilityEditor, ativo: event.target.checked })} /><span><strong>Capacitação ativa</strong><small>Somente capacitações ativas podem ser atribuídas a novos recursos.</small></span></label></CrudModal>}
    {deleteTarget && <CrudModal mode="delete" title={deleteTarget.kind === "resource" ? "Excluir recurso" : "Excluir capacitação"} onClose={() => setDeleteTarget(null)} onSubmit={confirmDelete} actions={<><button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="submit" className="danger" disabled={saving}>Excluir</button></>}><p>Confirma a exclusão de <strong>{deleteTarget.items.length} registro(s)</strong>?</p></CrudModal>}
  </section>;
}
