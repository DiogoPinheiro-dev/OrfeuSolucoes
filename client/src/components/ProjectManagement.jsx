import { useCallback, useEffect, useMemo, useState } from "react";

import {
    arquivarProjeto,
    atualizarCicloProjeto,
    createProjeto,
    getProjeto,
    getProjetoParticipantesDisponiveis,
    getProjetos,
    reativarProjeto,
    sugerirChaveProjeto,
    updateProjeto,
    updateProjetoEquipe
} from "../../services/Projetos/ProjetoService";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import ProjectEditorModal from "./ProjectEditorModal";

import "../styles/projectManagement.css";

const METODOLOGIAS = { SCRUM: "Scrum", KANBAN: "Kanban", HIBRIDA: "Híbrida", OUTRA: "Outra" };
const SITUACOES = { RASCUNHO: "Rascunho", PLANEJADO: "Planejado", EM_ANDAMENTO: "Em andamento", PAUSADO: "Pausado", CONCLUIDO: "Concluído", CANCELADO: "Cancelado" };
const SAUDES = { EM_DIA: "Em dia", EM_RISCO: "Em risco", ATRASADO: "Atrasado" };
const TRANSICOES = {
    RASCUNHO: ["RASCUNHO", "PLANEJADO", "CANCELADO"],
    PLANEJADO: ["PLANEJADO", "EM_ANDAMENTO", "PAUSADO", "CANCELADO"],
    EM_ANDAMENTO: ["EM_ANDAMENTO", "PAUSADO", "CONCLUIDO", "CANCELADO"],
    PAUSADO: ["PAUSADO", "PLANEJADO", "EM_ANDAMENTO", "CANCELADO"],
    CONCLUIDO: ["CONCLUIDO", "PLANEJADO"],
    CANCELADO: ["CANCELADO", "PLANEJADO"]
};
const PAPEIS = { RESPONSAVEL: "Responsável", MEMBRO: "Membro", OBSERVADOR: "Observador" };

const formatDate = (value, withTime = false) => {
    if (!value) return "Não informado";
    if (!withTime && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10).split("-").reverse().join("/");
    return new Intl.DateTimeFormat("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : undefined).format(new Date(value));
};
const userLabel = (user) => user?.nome || user?.login || user?.email || "Não informado";

function DetailField({ label, children }) {
    return <div className="project-detail-field"><span>{label}</span><strong>{children || "Não informado"}</strong></div>;
}

function PermissionList({ permissions }) {
    const labels = { podeVisualizar: "Visualizar", podeAlterar: "Alterar cadastro", podeGerenciarMembros: "Gerenciar equipe", podeAlterarStatus: "Alterar status", podeArquivar: "Arquivar", podeReativar: "Reativar" };
    return <div className="project-permissions" aria-label="Permissões efetivas">{Object.entries(labels).map(([key, label]) => <span key={key} className={permissions?.[key] ? "allowed" : "denied"}>{label}: {permissions?.[key] ? "sim" : "não"}</span>)}</div>;
}

export default function ProjectManagement({ permissions }) {
    const [rows, setRows] = useState([]);
    const [pageInfo, setPageInfo] = useState({ total: 0, pagina: 1, limite: 20, totalPaginas: 0 });
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState({ metodologia: "", situacao: "", saude: "", incluirArquivados: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [activeTab, setActiveTab] = useState("geral");
    const [editor, setEditor] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [editorError, setEditorError] = useState("");
    const [cycle, setCycle] = useState(null);
    const [archiveCandidate, setArchiveCandidate] = useState(null);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getProjetos({ pagina: pageInfo.pagina, limite: pageInfo.limite, termo: debouncedSearch || undefined, metodologia: filters.metodologia || undefined, situacao: filters.situacao || undefined, saude: filters.saude || undefined, incluirArquivados: filters.incluirArquivados });
            setRows(response.items || []);
            setPageInfo((current) => ({ ...current, total: response.total, pagina: response.pagina, limite: response.limite, totalPaginas: response.totalPaginas }));
            setSelectedId((current) => response.items?.some((item) => item.id === current) ? current : null);
        } catch (loadError) {
            setRows([]);
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filters, pageInfo.limite, pageInfo.pagina]);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    const changeFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
        setPageInfo((current) => ({ ...current, pagina: 1 }));
    };

    const openDetail = async (project) => {
        if (project.permissoes?.podeVisualizar === false) return;
        setDetail(project); setDetailLoading(true); setDetailError(""); setActiveTab("geral");
        try { setDetail(await getProjeto(project.id)); } catch (loadError) { setDetailError(loadError.message); } finally { setDetailLoading(false); }
    };

    const loadEditorData = async (project = null) => {
        setEditorError("");
        try {
            const [fullProject, users] = await Promise.all([project ? getProjeto(project.id) : Promise.resolve(null), getProjetoParticipantesDisponiveis()]);
            setAvailableUsers(users);
            setEditor({ mode: project ? "edit" : "create", project: fullProject });
        } catch (loadError) { setError(loadError.message); }
    };

    const saveProject = async (form) => {
        setSaving(true); setEditorError("");
        try {
            if (editor.mode === "create") {
                await createProjeto(form);
                setNotice("Projeto criado com sucesso.");
            } else {
                const current = editor.project;
                if (current.permissoes?.podeAlterar) {
                    await updateProjeto({ id: current.id, nome: form.nome, objetivo: form.objetivo, descricao: form.descricao, metodologia: form.metodologia, inicioPrevistoEm: form.inicioPrevistoEm, fimPrevistoEm: form.fimPrevistoEm });
                }
                if (current.permissoes?.podeGerenciarMembros) {
                    await updateProjetoEquipe({ projetoId: current.id, responsavelId: form.responsavelId, participantes: form.participantes });
                }
                setNotice("Projeto atualizado com sucesso.");
            }
            setEditor(null);
            await loadProjects();
        } catch (saveError) { setEditorError(saveError.message); } finally { setSaving(false); }
    };

    const saveCycle = async (event) => {
        event.preventDefault(); setSaving(true); setEditorError("");
        try {
            await atualizarCicloProjeto({ projetoId: cycle.id, situacao: cycle.situacao, saude: cycle.saude });
            setCycle(null); setNotice("Ciclo de vida atualizado com sucesso."); await loadProjects();
        } catch (saveError) { setEditorError(saveError.message); } finally { setSaving(false); }
    };

    const confirmArchive = async (event) => {
        event.preventDefault();
        if (!archiveCandidate) return;
        setSaving(true); setEditorError("");
        try {
            await arquivarProjeto(archiveCandidate.id);
            setArchiveCandidate(null);
            setNotice("Projeto arquivado com sucesso.");
            await loadProjects();
        } catch (actionError) {
            setEditorError(actionError.message);
        } finally {
            setSaving(false);
        }
    };

    const reactivateSelected = async (project) => {
        setLoading(true); setError("");
        try { await reativarProjeto(project.id); setNotice("Projeto reativado com sucesso."); await loadProjects(); } catch (actionError) { setError(actionError.message); } finally { setLoading(false); }
    };

    const selected = rows.find((row) => row.id === selectedId);
    const columns = useMemo(() => [
        { key: "chave", label: "Chave" }, { key: "nome", label: "Nome", render: (row) => <span className="project-name-cell"><span>{row.nome}</span>{row.arquivadoEm && <span className="project-archived-badge">Arquivado</span>}</span> },
        { key: "metodologia", label: "Metodologia", render: (row) => METODOLOGIAS[row.metodologia] || row.metodologia },
        { key: "responsavel", label: "Responsável", render: (row) => userLabel(row.responsavel) },
        { key: "situacao", label: "Status", render: (row) => <span className={`project-badge status-${row.situacao?.toLowerCase()}`}>{SITUACOES[row.situacao] || row.situacao}</span> },
        { key: "saude", label: "Saúde", render: (row) => <span className={`project-badge health-${row.saude?.toLowerCase()}`}>{SAUDES[row.saude] || row.saude}</span> },
        { key: "fimPrevistoEm", label: "Término previsto", render: (row) => formatDate(row.fimPrevistoEm) }
    ], []);

    return <div className="project-management">
        {error && <div className="project-alert" role="alert">{error}<button type="button" onClick={loadProjects}>Tentar novamente</button></div>}
        {notice && <div className="project-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>Fechar</button></div>}
        <div className="project-context-actions" aria-label="Ações do projeto selecionado">
            {selected?.permissoes?.podeAlterarStatus && !selected.arquivadoEm && <button type="button" onClick={() => { setEditorError(""); setCycle({ id: selected.id, chave: selected.chave, situacaoOriginal: selected.situacao, situacao: selected.situacao, saude: selected.saude }); }}>Alterar ciclo</button>}
            {selected?.permissoes?.podeArquivar && !selected.arquivadoEm && <button type="button" onClick={() => { setEditorError(""); setArchiveCandidate(selected); }}>Arquivar</button>}
            {selected?.permissoes?.podeReativar && selected.arquivadoEm && <button type="button" onClick={() => reactivateSelected(selected)}>Reativar</button>}
        </div>
        <CrudGrid title="Cadastro de projetos" kicker="Projetos" columns={columns} rows={rows} selectedId={selectedId} onSelect={setSelectedId} onCreate={() => loadEditorData()} onEdit={loadEditorData} onView={openDetail} search={search} onSearchChange={(value) => { setSearch(value); setPageInfo((current) => ({ ...current, pagina: 1 })); }} filters={<><label>Metodologia<select value={filters.metodologia} onChange={(event) => changeFilter("metodologia", event.target.value)}><option value="">Todas</option>{Object.entries(METODOLOGIAS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Status<select value={filters.situacao} onChange={(event) => changeFilter("situacao", event.target.value)}><option value="">Todos</option>{Object.entries(SITUACOES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Saúde<select value={filters.saude} onChange={(event) => changeFilter("saude", event.target.value)}><option value="">Todas</option>{Object.entries(SAUDES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="project-archive-filter"><input type="checkbox" checked={filters.incluirArquivados} onChange={(event) => changeFilter("incluirArquivados", event.target.checked)} />Incluir arquivados</label></>} pagination={<><span>{pageInfo.total} projeto(s) · Página {pageInfo.pagina} de {Math.max(pageInfo.totalPaginas, 1)}</span><button type="button" disabled={pageInfo.pagina <= 1 || loading} onClick={() => setPageInfo((current) => ({ ...current, pagina: current.pagina - 1 }))}>Anterior</button><button type="button" disabled={pageInfo.pagina >= pageInfo.totalPaginas || loading} onClick={() => setPageInfo((current) => ({ ...current, pagina: current.pagina + 1 }))}>Próxima</button></>} emptyMessage={filters.incluirArquivados ? "Nenhum projeto encontrado, incluindo os arquivados." : "Nenhum projeto ativo encontrado."} busy={loading} canCreate={permissions?.podeIncluir === true} canEdit={!!selected && (selected.permissoes?.podeAlterar || selected.permissoes?.podeGerenciarMembros) && !selected.arquivadoEm} canView={selected?.permissoes?.podeVisualizar !== false} showDelete={false} selectable={false} />

        {editor && <ProjectEditorModal mode={editor.mode} project={editor.project} users={availableUsers} saving={saving} error={editorError} canManageTeam={editor.mode === "create" || editor.project?.permissoes?.podeGerenciarMembros} canEditDetails={editor.mode === "create" || editor.project?.permissoes?.podeAlterar} onClose={() => setEditor(null)} onSuggestKey={sugerirChaveProjeto} onSubmit={saveProject} />}
        {archiveCandidate && <CrudModal mode="archive" title="Arquivar projeto" ariaLabel="Confirmar arquivamento do projeto" onClose={() => setArchiveCandidate(null)} onSubmit={confirmArchive} formClassName="project-archive-confirm" actions={<><button type="button" className="secondary" onClick={() => setArchiveCandidate(null)} disabled={saving}>Cancelar</button><button type="submit" className="danger" disabled={saving}>{saving ? "Arquivando..." : "Arquivar"}</button></>}><p>Você está prestes a arquivar o projeto:</p><strong>{archiveCandidate.chave} — {archiveCandidate.nome}</strong><p>O projeto deixará de aparecer na listagem ativa, mas poderá ser consultado e reativado pelo filtro de arquivados.</p>{editorError && <p className="project-detail-error" role="alert">{editorError}</p>}</CrudModal>}        {cycle && <CrudModal mode="edit" title={`Ciclo de ${cycle.chave}`} onClose={() => setCycle(null)} onSubmit={saveCycle} formClassName="project-form" actions={<><button type="button" className="secondary" onClick={() => setCycle(null)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button></>}><div className="project-form-grid"><label>Status<select value={cycle.situacao} onChange={(event) => setCycle((current) => ({ ...current, situacao: event.target.value }))}>{(TRANSICOES[cycle.situacaoOriginal] || [cycle.situacaoOriginal]).map((value) => <option key={value} value={value}>{SITUACOES[value]}</option>)}</select></label><label>Saúde<select value={cycle.saude} onChange={(event) => setCycle((current) => ({ ...current, saude: event.target.value }))}>{Object.entries(SAUDES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{editorError && <p className="project-detail-error" role="alert">{editorError}</p>}</CrudModal>}
        {detail && <CrudModal mode="view" title={`${detail.chave} — ${detail.nome}`} ariaLabel="Detalhes do projeto" onClose={() => setDetail(null)} onSubmit={(event) => event.preventDefault()} actions={<button type="button" onClick={() => setDetail(null)}>Fechar</button>}><nav className="crud-modal-tabs" aria-label="Seções do projeto">{[{ id: "geral", label: "Geral" }, { id: "planejamento", label: "Planejamento" }, { id: "equipe", label: "Equipe" }].map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>{detailLoading && <p role="status">Carregando detalhes...</p>}{detailError && <p className="project-detail-error" role="alert">{detailError}</p>}{activeTab === "geral" && <><div className="project-detail-grid"><DetailField label="Chave">{detail.chave}</DetailField><DetailField label="Nome">{detail.nome}</DetailField><DetailField label="Metodologia">{METODOLOGIAS[detail.metodologia]}</DetailField><DetailField label="Status">{SITUACOES[detail.situacao]}</DetailField><DetailField label="Saúde">{SAUDES[detail.saude]}</DetailField><DetailField label="Responsável">{userLabel(detail.responsavel)}</DetailField><DetailField label="Objetivo">{detail.objetivo}</DetailField><DetailField label="Descrição">{detail.descricao}</DetailField><DetailField label="Seu papel">{PAPEIS[detail.meuPapel] || "Administrador"}</DetailField><DetailField label="Arquivado em">{formatDate(detail.arquivadoEm, true)}</DetailField></div><h4>Permissões efetivas</h4><PermissionList permissions={detail.permissoes} /></>}{activeTab === "planejamento" && <div className="project-detail-grid"><DetailField label="Início previsto">{formatDate(detail.inicioPrevistoEm)}</DetailField><DetailField label="Término previsto">{formatDate(detail.fimPrevistoEm)}</DetailField><DetailField label="Início real">{formatDate(detail.inicioRealEm)}</DetailField><DetailField label="Término real">{formatDate(detail.fimRealEm)}</DetailField><DetailField label="Criado por">{userLabel(detail.criadoPor)}</DetailField><DetailField label="Criado em">{formatDate(detail.criadoEm, true)}</DetailField><DetailField label="Atualizado em">{formatDate(detail.atualizadoEm, true)}</DetailField><DetailField label="Arquivado por">{userLabel(detail.arquivadoPor)}</DetailField></div>}{activeTab === "equipe" && (detail.membros?.length ? <div className="project-team">{detail.membros.map((member) => <article key={member.id}><strong>{userLabel(member.usuario)}</strong><span>{member.usuario.email}</span><span>{PAPEIS[member.papel] || member.papel}</span><small>Desde {formatDate(member.incluidoEm, true)}</small></article>)}</div> : <p>Nenhum participante adicional.</p>)}</CrudModal>}
    </div>;
}