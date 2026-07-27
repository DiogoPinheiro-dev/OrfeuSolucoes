import { useCallback, useEffect, useMemo, useState } from "react";
import { FaArchive, FaBoxOpen, FaEdit, FaFlag, FaPlus, FaTimes, FaUndoAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

import { getBacklogProjetos } from "../../services/Projetos/BacklogService";
import {
    archiveEntrega,
    archiveMarco,
    createEntrega,
    createMarco,
    getMarcoEntregaPainel,
    updateEntrega,
    updateMarco
} from "../../services/Projetos/MarcoEntregaService";
import "../styles/crudGrid.css";
import "../styles/crudModal.css";
import "../styles/marcoEntregaManagement.css";

const MARCO_STATUS = { PLANEJADO: "Planejado", ATINGIDO: "Atingido", CANCELADO: "Cancelado" };
const ENTREGA_STATUS = {
    PLANEJADA: "Planejada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada"
};
const emptyMarco = {
    nome: "", descricao: "", responsavelId: "", status: "PLANEJADO",
    dataPrevistaEm: "", dataRealizadaEm: "", itemIds: []
};
const emptyEntrega = {
    nome: "", resultadoEsperado: "", criteriosAceite: "", responsavelId: "",
    status: "PLANEJADA", inicioPrevistoEm: "", fimPrevistoEm: "",
    concluidaEm: "", marcoId: "", itemIds: []
};
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const dateLabel = (value) => value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
    : "—";
const userLabel = (user) => user?.nome || user?.login || user?.email || "Não atribuído";

function Editor({ kind, item, panel, saving, error, onClose, onSubmit }) {
    const isMarco = kind === "MARCO";
    const [form, setForm] = useState(() => isMarco ? {
        ...emptyMarco,
        ...(item || {}),
        dataPrevistaEm: dateInput(item?.dataPrevistaEm),
        dataRealizadaEm: dateInput(item?.dataRealizadaEm),
        itemIds: item?.itens?.map((entry) => entry.id) || []
    } : {
        ...emptyEntrega,
        ...(item || {}),
        inicioPrevistoEm: dateInput(item?.inicioPrevistoEm),
        fimPrevistoEm: dateInput(item?.fimPrevistoEm),
        concluidaEm: dateInput(item?.concluidaEm),
        marcoId: item?.marcoId || "",
        itemIds: item?.itens?.map((entry) => entry.id) || []
    });
    const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const toggleItem = (id) => change(
        "itemIds",
        form.itemIds.includes(id) ? form.itemIds.filter((itemId) => itemId !== id) : [...form.itemIds, id]
    );

    return (
        <div className="crud-modal-backdrop" role="presentation">
            <section className="crud-modal commitment-modal" role="dialog" aria-modal="true">
                <header className="crud-modal-header">
                    <div>
                        <span>{isMarco ? "Acontecimento do projeto" : "Compromisso de negócio"}</span>
                        <h3>{item ? "Alterar" : "Incluir"} {isMarco ? "marco" : "entrega"}</h3>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar"><FaTimes /></button>
                </header>
                <form onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
                    <div className="commitment-form">
                        {error && <div className="commitment-feedback error">{error}</div>}
                        <label className="wide"><span>Nome *</span><input required maxLength={160} value={form.nome} onChange={(event) => change("nome", event.target.value)} /></label>
                        {isMarco ? (
                            <label className="wide"><span>Descrição</span><textarea rows={3} maxLength={1000} value={form.descricao} onChange={(event) => change("descricao", event.target.value)} /></label>
                        ) : (
                            <>
                                <label className="wide"><span>Resultado esperado *</span><textarea required rows={3} value={form.resultadoEsperado} onChange={(event) => change("resultadoEsperado", event.target.value)} /></label>
                                <label className="wide"><span>Critérios de aceite *</span><textarea required rows={3} value={form.criteriosAceite} onChange={(event) => change("criteriosAceite", event.target.value)} /></label>
                            </>
                        )}
                        <label><span>Responsável *</span><select required value={form.responsavelId} onChange={(event) => change("responsavelId", event.target.value)}><option value="">Selecione</option>{panel.responsaveis.map((user) => <option key={user.id} value={user.id}>{userLabel(user)}</option>)}</select></label>
                        <label><span>Status *</span><select value={form.status} onChange={(event) => change("status", event.target.value)}>{Object.entries(isMarco ? MARCO_STATUS : ENTREGA_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        {isMarco ? (
                            <>
                                <label><span>Data prevista *</span><input type="date" required value={form.dataPrevistaEm} onChange={(event) => change("dataPrevistaEm", event.target.value)} /></label>
                                <label><span>Data realizada</span><input type="date" value={form.dataRealizadaEm} onChange={(event) => change("dataRealizadaEm", event.target.value)} /></label>
                            </>
                        ) : (
                            <>
                                <label><span>Início previsto *</span><input type="date" required value={form.inicioPrevistoEm} onChange={(event) => change("inicioPrevistoEm", event.target.value)} /></label>
                                <label><span>Fim previsto *</span><input type="date" required value={form.fimPrevistoEm} onChange={(event) => change("fimPrevistoEm", event.target.value)} /></label>
                                <label><span>Data de conclusão</span><input type="date" value={form.concluidaEm} onChange={(event) => change("concluidaEm", event.target.value)} /></label>
                                <label><span>Marco relacionado</span><select value={form.marcoId} onChange={(event) => change("marcoId", event.target.value)}><option value="">Nenhum</option>{panel.marcos.filter((marco) => !marco.arquivadoEm).map((marco) => <option key={marco.id} value={marco.id}>{marco.nome}</option>)}</select></label>
                            </>
                        )}
                        <fieldset className="wide commitment-items">
                            <legend>Itens relacionados</legend>
                            {panel.itensDisponiveis.map((entry) => (
                                <label key={entry.id}>
                                    <input type="checkbox" checked={form.itemIds.includes(entry.id)} onChange={() => toggleItem(entry.id)} />
                                    <span><strong>{entry.chave}</strong>{entry.titulo}</span>
                                </label>
                            ))}
                            {!panel.itensDisponiveis.length && <p>Nenhum item disponível.</p>}
                        </fieldset>
                    </div>
                    <footer className="crud-modal-actions">
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
                    </footer>
                </form>
            </section>
        </div>
    );
}

function Progress({ value }) {
    return <div className="commitment-progress" aria-label={`Progresso ${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

export default function MarcoEntregaManagement() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [includeArchived, setIncludeArchived] = useState(false);
    const [tab, setTab] = useState("MARCO");
    const [panel, setPanel] = useState({ marcos: [], entregas: [], itensDisponiveis: [], responsaveis: [], permissoes: {} });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [editor, setEditor] = useState(null);
    const [editorError, setEditorError] = useState("");

    const selectedProject = projects.find((item) => item.id === projectId);
    const records = useMemo(() => tab === "MARCO" ? panel.marcos : panel.entregas, [panel, tab]);

    useEffect(() => {
        getBacklogProjetos(true)
            .then((items) => {
                setProjects(items);
                setProjectId((current) => items.some((item) => item.id === current) ? current : items.find((item) => !item.arquivadoEm)?.id || items[0]?.id || "");
            })
            .catch((loadError) => setError(loadError.message));
    }, []);

    const load = useCallback(async () => {
        if (!projectId) { setLoading(false); return; }
        setLoading(true);
        setError("");
        try {
            setPanel(await getMarcoEntregaPainel(projectId, includeArchived));
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, [includeArchived, projectId]);
    useEffect(() => { load(); }, [load]);

    const run = async (operation, message, close = false) => {
        setSaving(true);
        setEditorError("");
        try {
            await operation();
            if (close) setEditor(null);
            setNotice(message);
            await load();
        } catch (operationError) {
            if (editor) setEditorError(operationError.message);
            else setError(operationError.message);
        } finally {
            setSaving(false);
        }
    };

    const submit = (form) => {
        const input = {
            ...form,
            projetoId: projectId,
            ...(editor.item ? { id: editor.item.id, versao: editor.item.versao } : {}),
            ...(editor.kind === "MARCO"
                ? { dataRealizadaEm: form.dataRealizadaEm || null }
                : { concluidaEm: form.concluidaEm || null, marcoId: form.marcoId || null })
        };
        const operation = editor.kind === "MARCO"
            ? (editor.item ? updateMarco : createMarco)
            : (editor.item ? updateEntrega : createEntrega);
        run(() => operation(input), `${editor.kind === "MARCO" ? "Marco" : "Entrega"} salvo com sucesso.`, true);
    };

    const toggleArchive = (item) => {
        const service = tab === "MARCO" ? archiveMarco : archiveEntrega;
        run(
            () => service({ id: item.id, versao: item.versao }, !!item.arquivadoEm),
            `${tab === "MARCO" ? "Marco" : "Entrega"} ${item.arquivadoEm ? "reativado" : "arquivado"}.`
        );
    };

    return (
        <section className="commitment-management crud-shell">
            <header className="crud-header commitment-header">
                <div><span className="crud-kicker">Gestão operacional</span><h2>Marcos e entregas</h2><p>Acompanhe acontecimentos, compromissos, progresso e riscos do projeto.</p></div>
            </header>
            <div className="crud-filters commitment-filters">
                <label><span>Projeto</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}{project.arquivadoEm ? " (arquivado)" : ""}</option>)}</select></label>
                <label className="commitment-check"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />Arquivados</label>
                {selectedProject?.arquivadoEm && <span className="commitment-readonly">Projeto arquivado: somente leitura</span>}
            </div>
            {error && <div className="commitment-feedback error">{error}</div>}
            {notice && <div className="commitment-feedback success">{notice}</div>}
            <nav className="commitment-tabs" aria-label="Visões de marcos e entregas">
                <button className={tab === "MARCO" ? "active" : ""} onClick={() => setTab("MARCO")}><FaFlag /> Marcos <span>{panel.marcos.length}</span></button>
                <button className={tab === "ENTREGA" ? "active" : ""} onClick={() => setTab("ENTREGA")}><FaBoxOpen /> Entregas <span>{panel.entregas.length}</span></button>
            </nav>
            <div className="crud-toolbar">
                <button type="button" disabled={!panel.permissoes.podeCriar} onClick={() => { setEditorError(""); setEditor({ kind: tab, item: null }); }} aria-label="Incluir" title="Incluir"><FaPlus /></button>
            </div>
            {loading ? <div className="commitment-loading">Carregando...</div> : (
                <div className="commitment-grid">
                    {records.map((item) => (
                        <article key={item.id} className={`commitment-card ${item.arquivadoEm ? "archived" : ""}`}>
                            <header>
                                <div><span className={`commitment-status status-${item.status.toLowerCase()}`}>{(tab === "MARCO" ? MARCO_STATUS : ENTREGA_STATUS)[item.status]}</span><h3>{item.nome}</h3></div>
                                <div className="commitment-actions">
                                    <button type="button" disabled={!panel.permissoes.podeEditar || !!item.arquivadoEm} onClick={() => setEditor({ kind: tab, item })} title="Alterar"><FaEdit /></button>
                                    <button type="button" disabled={item.arquivadoEm ? !panel.permissoes.podeReativar : !panel.permissoes.podeArquivar} onClick={() => toggleArchive(item)} title={item.arquivadoEm ? "Reativar" : "Arquivar"}>{item.arquivadoEm ? <FaUndoAlt /> : <FaArchive />}</button>
                                </div>
                            </header>
                            <p>{tab === "MARCO" ? item.descricao || "Sem descrição." : item.resultadoEsperado}</p>
                            <dl>
                                <div><dt>Responsável</dt><dd>{userLabel(item.responsavel)}</dd></div>
                                <div><dt>Prazo</dt><dd>{tab === "MARCO" ? dateLabel(item.dataPrevistaEm) : `${dateLabel(item.inicioPrevistoEm)} a ${dateLabel(item.fimPrevistoEm)}`}</dd></div>
                                {tab === "ENTREGA" && <div><dt>Marco</dt><dd>{item.marcoNome || "Não relacionado"}</dd></div>}
                                <div><dt>Itens</dt><dd>{item.itens.length}</dd></div>
                            </dl>
                            {!!item.itens.length && (
                                <div className="commitment-related-items" aria-label="Itens relacionados">
                                    {item.itens.map((entry) => (
                                        <Link
                                            key={entry.id}
                                            to={`/hub/projetos/backlog-de-demandas?projetoId=${projectId}&itemId=${entry.id}`}
                                            title={`Abrir ${entry.chave} no backlog`}
                                        >
                                            <strong>{entry.chave}</strong>
                                            <span>{entry.titulo}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <footer>
                                <div><span>Progresso</span><strong>{item.progressoPercentual}%</strong><Progress value={item.progressoPercentual} /></div>
                                {(item.atrasado || item.atrasada) && <strong className="commitment-risk">Atrasado</strong>}
                                {item.itensSemEstimativa > 0 && <small>{item.itensSemEstimativa} item(ns) sem estimativa; progresso calculado pela quantidade de itens.</small>}
                            </footer>
                        </article>
                    ))}
                    {!records.length && <div className="commitment-empty">Nenhum {tab === "MARCO" ? "marco" : "entrega"} encontrado.</div>}
                </div>
            )}
            {editor && <Editor kind={editor.kind} item={editor.item} panel={panel} saving={saving} error={editorError} onClose={() => setEditor(null)} onSubmit={submit} />}
        </section>
    );
}
