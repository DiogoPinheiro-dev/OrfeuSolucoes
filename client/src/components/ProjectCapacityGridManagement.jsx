import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaExclamationTriangle, FaPlus, FaTrash } from "react-icons/fa";
import { excluirGradeAlocacao, excluirGradeCapacidade, getGradeCapacitacao, salvarGradeAlocacao, salvarGradeCapacidade, salvarGradeVinculo } from "../../services/Projetos/GradeCapacitacaoService";
import CrudGrid from "./CrudGrid";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import "../styles/crudGrid.css";
import "../styles/projectCapacityGrid.css";

const emptyPanel = { recursos: [], projetos: [], linhas: [], permissoes: {} };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Usuário";
const hours = (minutes) => `${(Number(minutes || 0) / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;
const dateLabel = (value) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)) : "—";
const dateInput = (value) => value ? String(value).slice(0, 10) : "";

export default function ProjectCapacityGridManagement() {
  const [panel, setPanel] = useState(emptyPanel);
  const [selectedId, setSelectedId] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [linkEditor, setLinkEditor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewTab, setViewTab] = useState("cadastro");
  const [periodEditor, setPeriodEditor] = useState(null);
  const [periodToDelete, setPeriodToDelete] = useState(null);

  const projects = useMemo(() => panel.projetos.slice().sort((a, b) => a.nome.localeCompare(b.nome)), [panel.projetos]);
  const resources = useMemo(() => panel.recursos.slice().sort((a, b) => userLabel(a.usuario).localeCompare(userLabel(b.usuario))), [panel.recursos]);
  const rows = useMemo(() => panel.linhas.filter((item) => (!projectFilter || item.projetoId === projectFilter) && (!resourceFilter || item.cadastroRecursoId === resourceFilter)), [panel.linhas, projectFilter, resourceFilter]);
  const selectedLine = useMemo(() => panel.linhas.find((item) => item.id === selectedId) || null, [panel.linhas, selectedId]);
  const viewLine = useMemo(() => panel.linhas.find((item) => item.id === viewId) || null, [panel.linhas, viewId]);
  const editorLine = useMemo(() => panel.linhas.find((item) => item.id === linkEditor?.id) || null, [panel.linhas, linkEditor?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getGradeCapacitacao();
      setPanel(result || emptyPanel);
      setSelectedId((current) => result?.linhas?.some((item) => item.id === current) ? current : result?.linhas?.[0]?.id || null);
    } catch (loadError) {
      setError(loadError.message);
      setPanel(emptyPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (selectedId && !rows.some((item) => item.id === selectedId)) setSelectedId(rows[0]?.id || null); }, [rows, selectedId]);

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

  const hasAvailableLink = useMemo(() => resources.some((resource) => resource.ativo && projects.some((project) => !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === resource.id && line.projetoId === project.id))), [panel.linhas, projects, resources]);
  const openLinkCreate = () => {
    const resource = resources.find((item) => item.ativo && projects.some((project) => !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === item.id && line.projetoId === project.id)));
    const project = projects.find((item) => !item.arquivadoEm && resource && !panel.linhas.some((line) => line.cadastroRecursoId === resource.id && line.projetoId === item.id));
    setLinkEditor({ mode: "create", activeTab: "cadastro", cadastroRecursoId: resource?.id || "", projetoId: project?.id || "", ativo: true });
  };
  const openLinkEdit = (line) => setLinkEditor({ mode: "edit", activeTab: "cadastro", id: line.id, versao: line.versao, cadastroRecursoId: line.cadastroRecursoId, projetoId: line.projetoId, ativo: line.vinculoAtivo });
  const openView = (line) => {
    setSelectedId(line.id);
    setViewId(line.id);
    setViewTab("cadastro");
  };
  const availableLinkProjects = useMemo(() => projects.filter((project) => linkEditor?.mode === "edit" ? project.id === linkEditor.projetoId : !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === linkEditor?.cadastroRecursoId && line.projetoId === project.id)), [linkEditor, panel.linhas, projects]);
  const submitLink = (event) => {
    event.preventDefault();
    const input = { cadastroRecursoId: linkEditor.cadastroRecursoId, projetoId: linkEditor.projetoId, ativo: linkEditor.ativo, ...(linkEditor.id ? { id: linkEditor.id, versao: linkEditor.versao } : {}) };
    void run(() => salvarGradeVinculo(input), linkEditor.id ? "Alocação do recurso alterada." : "Recurso alocado ao projeto.", () => setLinkEditor(null));
  };

  const openPeriod = (kind, item = null, line = selectedLine) => setPeriodEditor({
    kind,
    projetoId: line.projetoId,
    projetoRecursoId: line.id,
    id: item?.id,
    versao: item?.versao,
    inicioEm: dateInput(item?.inicioEm),
    fimEm: dateInput(item?.fimEm),
    horas: item ? String(Number(item[kind === "CAPACIDADE" ? "capacidadeMinutos" : "alocacaoMinutos"]) / 60) : "",
    atividade: kind === "ALOCACAO" ? item?.atividade || "" : ""
  });

  const submitPeriod = (event) => {
    event.preventDefault();
    const isCapacity = periodEditor.kind === "CAPACIDADE";
    const input = {
      projetoId: periodEditor.projetoId,
      projetoRecursoId: periodEditor.projetoRecursoId,
      inicioEm: periodEditor.inicioEm,
      fimEm: periodEditor.fimEm,
      ...(periodEditor.id ? { id: periodEditor.id, versao: periodEditor.versao } : {}),
      ...(isCapacity ? { capacidadeMinutos: Math.round(Number(periodEditor.horas) * 60) } : { atividade: periodEditor.atividade.trim(), alocacaoMinutos: Math.round(Number(periodEditor.horas) * 60) })
    };
    void run(() => isCapacity ? salvarGradeCapacidade(input) : salvarGradeAlocacao(input), `${isCapacity ? "Capacidade" : "Execução"} ${periodEditor.id ? "alterada" : "registrada"}.`, () => setPeriodEditor(null));
  };

  const confirmPeriodDelete = (event) => {
    event.preventDefault();
    const isCapacity = periodToDelete.kind === "CAPACIDADE";
    const input = { projetoId: periodToDelete.line.projetoId, id: periodToDelete.item.id, versao: periodToDelete.item.versao };
    void run(() => isCapacity ? excluirGradeCapacidade(input) : excluirGradeAlocacao(input), `${isCapacity ? "Capacidade" : "Execução"} excluída.`, () => setPeriodToDelete(null));
  };

  const columns = useMemo(() => [
    { key: "usuario", label: "Recurso", render: (row) => userLabel(row.usuario) },
    { key: "projeto", label: "Projeto", render: (row) => `${row.projeto.chave} — ${row.projeto.nome}` },
    { key: "capacidade", label: "Capacidade", render: (row) => hours(row.capacidadeTotalMinutos) },
    { key: "alocacao", label: "Alocação", render: (row) => hours(row.alocacaoTotalMinutos) },
    { key: "saldo", label: "Saldo", render: (row) => hours(row.saldoMinutos) },
    { key: "uso", label: "Uso", render: (row) => `${row.percentualAlocado}%` },
    { key: "execucao", label: "O que irá executar", render: (row) => row.alocacoes[0]?.atividade || "Ainda não informado" },
    { key: "risco", label: "Risco", render: (row) => row.sobrealocado ? "Sobrealocado" : "Regular" }
  ], []);

  const totalCapacity = rows.reduce((sum, item) => sum + item.capacidadeTotalMinutos, 0);
  const totalAllocation = rows.reduce((sum, item) => sum + item.alocacaoTotalMinutos, 0);

  return <section className="capacity-grid">
    <header className="crud-grid capacity-grid-header"><div><span className="workspace-label">Planejamento operacional</span><h2>Grade de capacitação</h2><p>Defina a disponibilidade, as horas alocadas e o que cada recurso irá executar nos projetos.</p></div></header>
    {error && <div className="capacity-feedback error" role="alert">{error}</div>}
    {success && <div className="capacity-feedback success">{success}</div>}
    <div className="capacity-summary"><article><span>Vínculos exibidos</span><strong>{rows.length}</strong></article><article><span>Capacidade</span><strong>{hours(totalCapacity)}</strong></article><article><span>Alocação</span><strong>{hours(totalAllocation)}</strong></article><article><span>Saldo</span><strong>{hours(totalCapacity - totalAllocation)}</strong></article></div>
    <CrudGrid
      title="Grade por recurso e projeto"
      kicker="Capacitação"
      columns={columns}
      rows={rows}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={openLinkCreate}
      onEdit={openLinkEdit}
      onView={openView}
      filters={<><label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select></label><label>Recurso<select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="">Todos os recursos</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{userLabel(resource.usuario)}</option>)}</select></label></>}
      emptyMessage={loading ? "Carregando grade..." : "Nenhum recurso alocado aos filtros selecionados."}
      busy={loading}
      canCreate={panel.permissoes?.podeIncluir && hasAvailableLink}
      canEdit={!!selectedLine && panel.permissoes?.podeAlterar}
      canView={!!selectedLine}
      showDelete={false}
      selectable={false}
    />
    {linkEditor && <CrudModal
      mode={linkEditor.mode === "create" ? "create" : "edit"}
      title={linkEditor.mode === "create" ? "Alocar recurso ao projeto" : "Alterar alocação do recurso"}
      onClose={() => setLinkEditor(null)}
      onSubmit={submitLink}
      formClassName="capacity-form"
      modalClassName="capacity-registration-modal"
      actions={<><button type="button" className="secondary" onClick={() => setLinkEditor(null)}>Cancelar</button><button type="submit" disabled={saving || !linkEditor.cadastroRecursoId || !linkEditor.projetoId}>{saving ? "Salvando..." : "Salvar"}</button></>}
    >
      <CrudModalTabs
        tabs={[{ id: "cadastro", label: "Cadastro" }, { id: "planejamento", label: "Planejamento" }]}
        activeTab={linkEditor.activeTab}
        onChange={(activeTab) => setLinkEditor({ ...linkEditor, activeTab })}
      />
      <CrudModalTabPanel active={linkEditor.activeTab === "cadastro"}>
        <div className="capacity-form-grid">
          <label><span>Recurso</span><select required disabled={linkEditor.mode === "edit"} value={linkEditor.cadastroRecursoId} onChange={(event) => { const cadastroRecursoId = event.target.value; const projetoId = projects.find((project) => !project.arquivadoEm && !panel.linhas.some((line) => line.cadastroRecursoId === cadastroRecursoId && line.projetoId === project.id))?.id || ""; setLinkEditor({ ...linkEditor, cadastroRecursoId, projetoId }); }}><option value="">Selecione</option>{resources.filter((item) => item.ativo || item.id === linkEditor.cadastroRecursoId).map((item) => <option key={item.id} value={item.id}>{userLabel(item.usuario)}</option>)}</select><small>Pessoa que participará do planejamento do projeto.</small></label>
          <label><span>Projeto</span><select required disabled={linkEditor.mode === "edit"} value={linkEditor.projetoId} onChange={(event) => setLinkEditor({ ...linkEditor, projetoId: event.target.value })}><option value="">Selecione</option>{availableLinkProjects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}</option>)}</select><small>Projeto ao qual o recurso ficará vinculado.</small></label>
          <label className="capacity-check"><input type="checkbox" checked={linkEditor.ativo} disabled={linkEditor.mode === "create"} onChange={(event) => setLinkEditor({ ...linkEditor, ativo: event.target.checked })} /><span><strong>Alocação ativa</strong><small>{linkEditor.mode === "edit" && linkEditor.ativo ? "Ao desativar, capacidades, execuções, custos e histórico serão preservados." : "O vínculo ativo permite a participação operacional no projeto."}</small></span></label>
        </div>
      </CrudModalTabPanel>
      <CrudModalTabPanel active={linkEditor.activeTab === "planejamento"}>
        {editorLine
          ? <PlanningPanel line={editorLine} permissions={panel.permissoes} editable onCreate={(kind) => openPeriod(kind, null, editorLine)} onEdit={(kind, item) => openPeriod(kind, item, editorLine)} onDelete={(kind, item) => setPeriodToDelete({ kind, item, line: editorLine })} />
          : <div className="capacity-planning-placeholder"><strong>Planejamento disponível após salvar</strong><p>Conclua o cadastro do vínculo para registrar capacidade e execuções planejadas.</p></div>}
      </CrudModalTabPanel>
    </CrudModal>}
    {viewLine && <CrudModal
      mode="view"
      title={userLabel(viewLine.usuario)}
      ariaLabel="Visualizar grade do recurso"
      onClose={() => setViewId(null)}
      onSubmit={(event) => event.preventDefault()}
      formClassName="capacity-view-form"
      modalClassName="capacity-registration-modal"
      actions={<button type="button" onClick={() => setViewId(null)}>Fechar</button>}
    >
      <CrudModalTabs
        tabs={[{ id: "cadastro", label: "Cadastro" }, { id: "planejamento", label: "Planejamento" }]}
        activeTab={viewTab}
        onChange={setViewTab}
      />
      <CrudModalTabPanel active={viewTab === "cadastro"}>
        <div className="capacity-view-grid">
          <article><span>Recurso</span><strong>{userLabel(viewLine.usuario)}</strong></article>
          <article><span>Projeto</span><strong>{viewLine.projeto.chave} — {viewLine.projeto.nome}</strong></article>
          <article><span>Situação do recurso</span><strong>{viewLine.recursoAtivo ? "Ativo" : "Inativo"}</strong></article>
          <article><span>Situação da alocação</span><strong>{viewLine.vinculoAtivo ? "Ativa" : "Inativa"}</strong></article>
        </div>
      </CrudModalTabPanel>
      <CrudModalTabPanel active={viewTab === "planejamento"}>
        <PlanningPanel line={viewLine} permissions={panel.permissoes} />
      </CrudModalTabPanel>
    </CrudModal>}
    {periodEditor && <CrudModal mode={periodEditor.id ? "edit" : "create"} title={`${periodEditor.id ? "Alterar" : "Registrar"} ${periodEditor.kind === "CAPACIDADE" ? "capacidade" : "execução planejada"}`} onClose={() => setPeriodEditor(null)} onSubmit={submitPeriod} formClassName="capacity-period-form" modalClassName="capacity-period-modal" actions={<><button type="button" className="secondary" onClick={() => setPeriodEditor(null)}>Cancelar</button><button type="submit" disabled={saving || (periodEditor.kind === "ALOCACAO" && periodEditor.atividade.trim().length < 3)}>Salvar</button></>}>
      {periodEditor.kind === "ALOCACAO" && <label className="capacity-period-wide"><span>O que o recurso irá executar</span><textarea required minLength={3} maxLength={500} rows={4} value={periodEditor.atividade} onChange={(event) => setPeriodEditor({ ...periodEditor, atividade: event.target.value })} placeholder="Ex.: Implementar e homologar a integração de faturamento" /><small>Descreva a entrega ou atividade planejada para este período.</small></label>}
      <div className="capacity-period-fields"><label><span>Início</span><input required type="date" value={periodEditor.inicioEm} onChange={(event) => setPeriodEditor({ ...periodEditor, inicioEm: event.target.value })} /></label><label><span>Fim</span><input required type="date" value={periodEditor.fimEm} onChange={(event) => setPeriodEditor({ ...periodEditor, fimEm: event.target.value })} /></label><label><span>Horas</span><input required min="0.01" step="0.01" type="number" value={periodEditor.horas} onChange={(event) => setPeriodEditor({ ...periodEditor, horas: event.target.value })} /><small>Informe horas com até duas casas decimais.</small></label></div>
    </CrudModal>}
    {periodToDelete && <CrudModal mode="delete" title={`Excluir ${periodToDelete.kind === "CAPACIDADE" ? "capacidade" : "execução"}`} onClose={() => setPeriodToDelete(null)} onSubmit={confirmPeriodDelete} actions={<><button type="button" className="secondary" onClick={() => setPeriodToDelete(null)}>Cancelar</button><button type="submit" className="danger" disabled={saving}>Excluir</button></>}><p>Confirma a exclusão do período de {dateLabel(periodToDelete.item.inicioEm)} a {dateLabel(periodToDelete.item.fimEm)}?</p></CrudModal>}
  </section>;
}

function PlanningPanel({ line, permissions = {}, editable = false, onCreate, onEdit, onDelete }) {
  const writable = editable && line.recursoAtivo && line.vinculoAtivo && !line.projeto?.arquivadoEm;
  return <section className="capacity-planning">
    <div className="capacity-planning-heading">
      <div><span>Planejamento do vínculo</span><strong>{line.projeto.chave} — {line.projeto.nome}</strong></div>
      {line.sobrealocado && <strong className="capacity-risk"><FaExclamationTriangle /> Sobrealocado</strong>}
    </div>
    <div className="capacity-planning-summary">
      <article><span>Capacidade</span><strong>{hours(line.capacidadeTotalMinutos)}</strong></article>
      <article><span>Alocação</span><strong>{hours(line.alocacaoTotalMinutos)}</strong></article>
      <article><span>Saldo</span><strong>{hours(line.saldoMinutos)}</strong></article>
      <article><span>Uso</span><strong>{line.percentualAlocado}%</strong></article>
    </div>
    {editable && !writable && <div className="capacity-readonly">A grade está em somente leitura porque o recurso, o vínculo ou o projeto está inativo/arquivado.</div>}
    <div className="capacity-period-grid">
      <PeriodSection title="Capacidade disponível" kind="CAPACIDADE" rows={line.capacidades} canCreate={writable && permissions.podeIncluir} canEdit={writable && permissions.podeAlterar} canDelete={writable && permissions.podeExcluir} onCreate={() => onCreate?.("CAPACIDADE")} onEdit={(item) => onEdit?.("CAPACIDADE", item)} onDelete={(item) => onDelete?.("CAPACIDADE", item)} />
      <PeriodSection title="Execuções planejadas" kind="ALOCACAO" rows={line.alocacoes} canCreate={writable && permissions.podeIncluir} canEdit={writable && permissions.podeAlterar} canDelete={writable && permissions.podeExcluir} onCreate={() => onCreate?.("ALOCACAO")} onEdit={(item) => onEdit?.("ALOCACAO", item)} onDelete={(item) => onDelete?.("ALOCACAO", item)} />
    </div>
  </section>;
}

function PeriodSection({ title, kind, rows, canCreate, canEdit, canDelete, onCreate, onEdit, onDelete }) {
  const capacity = kind === "CAPACIDADE";
  return <section className="capacity-period">
    <div className="capacity-period-heading"><h4>{title}</h4>{canCreate && <button type="button" className="crud-inline-action" onClick={onCreate}><FaPlus /> Adicionar</button>}</div>
    {rows.length ? <div className="crud-table-wrap capacity-period-table-wrap">
      <table className="crud-table capacity-period-table">
        <thead><tr>{!capacity && <th>O que irá executar</th>}<th>Período</th><th>{capacity ? "Capacidade" : "Horas"}</th><th>Uso total</th><th>Risco</th>{(canEdit || canDelete) && <th>Ações</th>}</tr></thead>
        <tbody>{rows.map((item) => <tr key={item.id}>
          {!capacity && <td className="capacity-activity">{item.atividade || "Atividade não informada no registro legado"}</td>}
          <td>{dateLabel(item.inicioEm)} a {dateLabel(item.fimEm)}</td>
          <td>{hours(item[capacity ? "capacidadeMinutos" : "alocacaoMinutos"])}</td>
          <td>{capacity ? `${hours(item.alocadoMinutos)} · ${item.percentualAlocado}%` : `${hours(item.alocadoTotalMinutos)} · ${item.percentualAlocado}%`}</td>
          <td className={item.sobrealocado ? "risk" : ""}>{item.sobrealocado ? <><FaExclamationTriangle /> Sobrecarga</> : "Regular"}</td>
          {(canEdit || canDelete) && <td><div className="capacity-actions">{canEdit && <button type="button" onClick={() => onEdit(item)} aria-label="Editar período"><FaEdit /></button>}{canDelete && <button type="button" className="danger" onClick={() => onDelete(item)} aria-label="Excluir período"><FaTrash /></button>}</div></td>}
        </tr>)}</tbody>
      </table>
    </div> : <div className="capacity-empty">Nenhum período cadastrado.</div>}
  </section>;
}
