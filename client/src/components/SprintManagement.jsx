import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaBan,
    FaCheck,
    FaEdit,
    FaFlagCheckered,
    FaHistory,
    FaPlay,
    FaPlus,
    FaTasks,
    FaTimes
} from "react-icons/fa";

import { getBacklogProjetos } from "../../services/Projetos/BacklogService";
import {
    addSprintItem,
    cancelSprint,
    completeSprint,
    createSprint,
    getSprintPainel,
    removeSprintItem,
    startSprint,
    updateSprint
} from "../../services/Projetos/SprintService";
import "../styles/crudGrid.css";
import "../styles/crudModal.css";
import "../styles/sprintManagement.css";

const STATUS = {
    ABERTO: "Aberto",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado"
};
const SPRINT_STATUS = {
    PLANEJADA: "Planejada",
    ATIVA: "Ativa",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada"
};
const EMPTY_FORM = {
    nome: "",
    objetivo: "",
    inicioPrevistoEm: "",
    fimPrevistoEm: ""
};

const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const formatDate = (value) => value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
    : "—";
const estimate = (minutes) => {
    if (!minutes) return "Sem estimativa";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`;
};

function SprintFormModal({ sprint, saving, error, onClose, onSubmit }) {
    const [form, setForm] = useState(() => sprint ? {
        nome: sprint.nome,
        objetivo: sprint.objetivo || "",
        inicioPrevistoEm: dateInput(sprint.inicioPrevistoEm),
        fimPrevistoEm: dateInput(sprint.fimPrevistoEm)
    } : EMPTY_FORM);

    const submit = (event) => {
        event.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="crud-modal-backdrop sprint-modal-backdrop" role="presentation">
            <section className="crud-modal sprint-modal" role="dialog" aria-modal="true">
                <header className="crud-modal-header">
                    <div>
                        <span className="crud-modal-eyebrow">Planejamento de execução</span>
                        <h3>{sprint ? "Editar sprint" : "Nova sprint"}</h3>
                    </div>
                    <button className="crud-modal-close" type="button" onClick={onClose} aria-label="Fechar">
                        <FaTimes />
                    </button>
                </header>
                <form onSubmit={submit}>
                    <div className="crud-modal-body sprint-modal-body">
                        {error && <div className="crud-feedback error">{error}</div>}
                        <label className="crud-field sprint-field-wide">
                            <span>Nome *</span>
                            <input
                                autoFocus
                                required
                                maxLength={120}
                                value={form.nome}
                                onChange={(event) => setForm({ ...form, nome: event.target.value })}
                            />
                        </label>
                        <label className="crud-field sprint-field-wide">
                            <span>Objetivo</span>
                            <textarea
                                rows={3}
                                maxLength={500}
                                value={form.objetivo}
                                onChange={(event) => setForm({ ...form, objetivo: event.target.value })}
                            />
                        </label>
                        <label className="crud-field">
                            <span>Início previsto *</span>
                            <input
                                type="date"
                                required
                                value={form.inicioPrevistoEm}
                                onChange={(event) => setForm({ ...form, inicioPrevistoEm: event.target.value })}
                            />
                        </label>
                        <label className="crud-field">
                            <span>Fim previsto *</span>
                            <input
                                type="date"
                                required
                                value={form.fimPrevistoEm}
                                onChange={(event) => setForm({ ...form, fimPrevistoEm: event.target.value })}
                            />
                        </label>
                    </div>
                    <footer className="crud-modal-actions">
                        <button className="crud-button secondary" type="button" onClick={onClose}>Cancelar</button>
                        <button className="crud-button primary" type="submit" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar sprint"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}

function CompleteModal({ sprint, planned, saving, error, onClose, onSubmit }) {
    const [destination, setDestination] = useState("BACKLOG");
    const [sprintDestinoId, setSprintDestinoId] = useState("");
    const [resultado, setResultado] = useState("");
    const incomplete = sprint.itens.filter(
        (item) => !item.retiradoEm && item.status !== "CONCLUIDO"
    ).length;

    return (
        <div className="crud-modal-backdrop sprint-modal-backdrop" role="presentation">
            <section className="crud-modal sprint-modal" role="dialog" aria-modal="true">
                <header className="crud-modal-header">
                    <div>
                        <span className="crud-modal-eyebrow">Encerramento</span>
                        <h3>Concluir {sprint.nome}</h3>
                    </div>
                    <button className="crud-modal-close" type="button" onClick={onClose} aria-label="Fechar">
                        <FaTimes />
                    </button>
                </header>
                <form onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit({ destinoIncompletos: destination, sprintDestinoId, resultado });
                }}>
                    <div className="crud-modal-body sprint-modal-body">
                        {error && <div className="crud-feedback error">{error}</div>}
                        <div className="sprint-complete-summary sprint-field-wide">
                            <strong>{sprint.totalConcluidos} concluídos</strong>
                            <span>{incomplete} incompletos precisam de destino.</span>
                        </div>
                        <label className="crud-field sprint-field-wide">
                            <span>Destino dos itens incompletos *</span>
                            <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                                <option value="BACKLOG">Retornar ao backlog</option>
                                <option value="SPRINT" disabled={!planned.length}>Enviar para outra sprint planejada</option>
                            </select>
                        </label>
                        {destination === "SPRINT" && (
                            <label className="crud-field sprint-field-wide">
                                <span>Sprint de destino *</span>
                                <select
                                    required
                                    value={sprintDestinoId}
                                    onChange={(event) => setSprintDestinoId(event.target.value)}
                                >
                                    <option value="">Selecione</option>
                                    {planned.map((item) => (
                                        <option key={item.id} value={item.id}>{item.nome}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label className="crud-field sprint-field-wide">
                            <span>Resultado da sprint</span>
                            <textarea
                                rows={4}
                                maxLength={2000}
                                value={resultado}
                                onChange={(event) => setResultado(event.target.value)}
                                placeholder="Registre aprendizados, resultado alcançado e observações."
                            />
                        </label>
                    </div>
                    <footer className="crud-modal-actions">
                        <button className="crud-button secondary" type="button" onClick={onClose}>Voltar</button>
                        <button className="crud-button primary" type="submit" disabled={saving}>
                            {saving ? "Concluindo..." : "Concluir sprint"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}

function Progress({ sprint }) {
    return (
        <div className="sprint-progress">
            <div>
                <span>Progresso</span>
                <strong>{sprint.progressoPercentual}%</strong>
            </div>
            <div className="sprint-progress-track">
                <span style={{ width: `${sprint.progressoPercentual}%` }} />
            </div>
            <small>{sprint.totalConcluidos} de {sprint.totalItens} itens concluídos</small>
        </div>
    );
}

function ScopeList({ sprint, canPlan, onRemove }) {
    const current = sprint.itens.filter((item) => !item.retiradoEm);
    if (!current.length) {
        return <div className="sprint-empty-inline">Nenhum item planejado nesta sprint.</div>;
    }
    return (
        <div className="sprint-scope-list">
            {current.map((item) => (
                <article key={item.vinculoId} className="sprint-scope-item">
                    <div>
                        <strong>{item.chave}</strong>
                        <span>{item.titulo}</span>
                    </div>
                    <div className="sprint-scope-meta">
                        <span className={`sprint-status status-${item.status.toLowerCase()}`}>{STATUS[item.status]}</span>
                        <small>{estimate(item.estimativaMinutos)}</small>
                        {item.adicionadoAposInicio && <em>Adicionado após início</em>}
                        {canPlan && (
                            <button type="button" onClick={() => onRemove(item)} title="Retirar da sprint">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function SprintManagement() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [panel, setPanel] = useState({
        planejadas: [],
        ativa: null,
        historico: [],
        candidatos: [],
        permissoes: {}
    });
    const [tab, setTab] = useState("PLANEJAMENTO");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [modalError, setModalError] = useState("");
    const [candidateBySprint, setCandidateBySprint] = useState({});

    const selectedProject = projects.find((project) => project.id === projectId);

    const loadProjects = useCallback(async () => {
        try {
            const result = await getBacklogProjetos(true);
            setProjects(result);
            setProjectId((current) => result.some((item) => item.id === current)
                ? current
                : result.find((item) => !item.arquivadoEm)?.id || result[0]?.id || "");
        } catch (loadError) {
            setError(loadError.message);
        }
    }, []);

    const loadPanel = useCallback(async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError("");
        try {
            setPanel(await getSprintPainel(projectId));
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { loadProjects(); }, [loadProjects]);
    useEffect(() => { loadPanel(); }, [loadPanel]);
    useEffect(() => {
        if (!notice) return undefined;
        const timer = window.setTimeout(() => setNotice(""), 4500);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const run = async (operation, success, close = false) => {
        setSaving(true);
        setModalError("");
        try {
            await operation();
            if (close) setModal(null);
            setNotice(success);
            await loadPanel();
        } catch (operationError) {
            if (modal) setModalError(operationError.message);
            else setError(operationError.message);
        } finally {
            setSaving(false);
        }
    };

    const submitSprint = (form) => run(
        () => modal.sprint
            ? updateSprint({ id: modal.sprint.id, versao: modal.sprint.versao, ...form })
            : createSprint({ projetoId: projectId, ...form }),
        modal.sprint ? "Sprint atualizada." : "Sprint criada.",
        true
    );

    const board = useMemo(() => {
        const items = panel.ativa?.itens.filter((item) => !item.retiradoEm) || [];
        return ["ABERTO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"].map((status) => ({
            status,
            items: items.filter((item) => item.status === status)
        }));
    }, [panel.ativa]);

    return (
        <section className="sprint-management crud-shell">
            <header className="crud-header sprint-header">
                <div>
                    <span className="crud-kicker">Gestão operacional</span>
                    <h2>Sprints</h2>
                    <p>Planeje períodos de execução, acompanhe o quadro ativo e preserve o histórico de escopo.</p>
                </div>
                <button
                    className="crud-inline-action sprint-create-action"
                    type="button"
                    disabled={!projectId || !panel.permissoes.podeCriar}
                    onClick={() => { setModalError(""); setModal({ type: "FORM", sprint: null }); }}
                >
                    <FaPlus /> Nova sprint
                </button>
            </header>

            <div className="crud-filters sprint-toolbar">
                <label>
                    <span>Projeto</span>
                    <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.chave} — {project.nome}{project.arquivadoEm ? " (arquivado)" : ""}
                            </option>
                        ))}
                    </select>
                </label>
                {selectedProject?.arquivadoEm && (
                    <span className="sprint-readonly">Projeto arquivado: somente leitura</span>
                )}
            </div>

            {error && <div className="crud-feedback error">{error}</div>}
            {notice && <div className="crud-feedback success">{notice}</div>}

            <nav className="sprint-tabs" aria-label="Visões de sprints">
                <button className={tab === "PLANEJAMENTO" ? "active" : ""} onClick={() => setTab("PLANEJAMENTO")}>
                    <FaTasks /> Planejamento <span>{panel.planejadas.length}</span>
                </button>
                <button className={tab === "ATIVA" ? "active" : ""} onClick={() => setTab("ATIVA")}>
                    <FaPlay /> Sprint ativa <span>{panel.ativa ? 1 : 0}</span>
                </button>
                <button className={tab === "HISTORICO" ? "active" : ""} onClick={() => setTab("HISTORICO")}>
                    <FaHistory /> Histórico <span>{panel.historico.length}</span>
                </button>
            </nav>

            {loading ? (
                <div className="sprint-loading" role="status" aria-live="polite"><span aria-hidden="true" /><p>Carregando sprints...</p></div>
            ) : tab === "PLANEJAMENTO" ? (
                <div className="sprint-planning-list">
                    {!panel.planejadas.length && (
                        <div className="sprint-empty">
                            <FaFlagCheckered />
                            <h3>Nenhuma sprint planejada</h3>
                            <p>Crie o próximo período de execução e selecione os itens do backlog.</p>
                        </div>
                    )}
                    {panel.planejadas.map((sprint) => (
                        <article className="sprint-card" key={sprint.id}>
                            <header>
                                <div>
                                    <span className="sprint-status status-planejada">Planejada</span>
                                    <h3>{sprint.nome}</h3>
                                    <p>{sprint.objetivo || "Objetivo não informado."}</p>
                                </div>
                                <div className="sprint-card-actions">
                                    {panel.permissoes.podeEditar && (
                                        <button type="button" onClick={() => setModal({ type: "FORM", sprint })}>
                                            <FaEdit /> Editar
                                        </button>
                                    )}
                                    {panel.permissoes.podeIniciar && !panel.ativa && (
                                        <button
                                            className="primary"
                                            type="button"
                                            onClick={() => run(
                                                () => startSprint({ id: sprint.id, versao: sprint.versao }),
                                                "Sprint iniciada."
                                            )}
                                        >
                                            <FaPlay /> Iniciar
                                        </button>
                                    )}
                                    {panel.permissoes.podeCancelar && (
                                        <button
                                            className="danger"
                                            type="button"
                                            onClick={() => window.confirm(`Cancelar a sprint ${sprint.nome}?`) && run(
                                                () => cancelSprint({ id: sprint.id, versao: sprint.versao }),
                                                "Sprint cancelada."
                                            )}
                                        >
                                            <FaBan /> Cancelar
                                        </button>
                                    )}
                                </div>
                            </header>
                            <div className="sprint-period">
                                <span>{formatDate(sprint.inicioPrevistoEm)}</span>
                                <i />
                                <span>{formatDate(sprint.fimPrevistoEm)}</span>
                                <strong>{sprint.totalItens} itens</strong>
                            </div>
                            <ScopeList
                                sprint={sprint}
                                canPlan={panel.permissoes.podePlanejar}
                                onRemove={(item) => run(
                                    () => removeSprintItem({
                                        sprintId: sprint.id,
                                        itemId: item.itemId,
                                        versao: sprint.versao
                                    }),
                                    "Item retirado da sprint."
                                )}
                            />
                            {panel.permissoes.podePlanejar && (
                                <div className="sprint-add-scope">
                                    <select
                                        value={candidateBySprint[sprint.id] || ""}
                                        onChange={(event) => setCandidateBySprint({
                                            ...candidateBySprint,
                                            [sprint.id]: event.target.value
                                        })}
                                    >
                                        <option value="">Selecione um item do backlog</option>
                                        {panel.candidatos.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.chave} — {item.titulo}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={!candidateBySprint[sprint.id] || saving}
                                        onClick={() => run(
                                            () => addSprintItem({
                                                sprintId: sprint.id,
                                                itemId: candidateBySprint[sprint.id],
                                                versao: sprint.versao
                                            }),
                                            "Item adicionado à sprint."
                                        )}
                                    >
                                        <FaPlus /> Adicionar ao escopo
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            ) : tab === "ATIVA" ? (
                panel.ativa ? (
                    <div className="sprint-active">
                        <header className="sprint-active-summary">
                            <div>
                                <span className="sprint-status status-ativa">Em execução</span>
                                <h3>{panel.ativa.nome}</h3>
                                <p>{panel.ativa.objetivo || "Objetivo não informado."}</p>
                                <small>{formatDate(panel.ativa.inicioPrevistoEm)} a {formatDate(panel.ativa.fimPrevistoEm)}</small>
                            </div>
                            <Progress sprint={panel.ativa} />
                            <div className="sprint-card-actions">
                                {panel.permissoes.podeConcluir && (
                                    <button
                                        className="primary"
                                        type="button"
                                        onClick={() => setModal({ type: "COMPLETE", sprint: panel.ativa })}
                                    >
                                        <FaCheck /> Concluir
                                    </button>
                                )}
                                {panel.permissoes.podeCancelar && (
                                    <button
                                        className="danger"
                                        type="button"
                                        onClick={() => window.confirm(`Cancelar a sprint ${panel.ativa.nome}?`) && run(
                                            () => cancelSprint({ id: panel.ativa.id, versao: panel.ativa.versao }),
                                            "Sprint cancelada."
                                        )}
                                    >
                                        <FaBan /> Cancelar
                                    </button>
                                )}
                            </div>
                        </header>
                        <div className="sprint-scope-changes">
                            <span><strong>{panel.ativa.escopoInicialItens || 0}</strong> no escopo inicial</span>
                            <span><strong>+{panel.ativa.itensAdicionadosAposInicio}</strong> adicionados</span>
                            <span><strong>-{panel.ativa.itensRetiradosAposInicio}</strong> retirados</span>
                        </div>
                        <div className="sprint-board">
                            {board.map((column) => (
                                <section key={column.status}>
                                    <header>
                                        <h4>{STATUS[column.status]}</h4>
                                        <span>{column.items.length}</span>
                                    </header>
                                    <div>
                                        {column.items.map((item) => (
                                            <article key={item.vinculoId}>
                                                <strong>{item.chave}</strong>
                                                <p>{item.titulo}</p>
                                                <footer>
                                                    <span>{item.prioridade}</span>
                                                    <small>{estimate(item.estimativaMinutos)}</small>
                                                </footer>
                                            </article>
                                        ))}
                                        {!column.items.length && <small className="sprint-board-empty">Nenhum item</small>}
                                    </div>
                                </section>
                            ))}
                        </div>
                        {panel.permissoes.podePlanejar && (
                            <div className="sprint-active-scope">
                                <h4>Ajustar escopo durante a execução</h4>
                                <ScopeList
                                    sprint={panel.ativa}
                                    canPlan
                                    onRemove={(item) => run(
                                        () => removeSprintItem({
                                            sprintId: panel.ativa.id,
                                            itemId: item.itemId,
                                            versao: panel.ativa.versao
                                        }),
                                        "Item retirado da sprint ativa."
                                    )}
                                />
                                <div className="sprint-add-scope">
                                    <select
                                        value={candidateBySprint[panel.ativa.id] || ""}
                                        onChange={(event) => setCandidateBySprint({
                                            ...candidateBySprint,
                                            [panel.ativa.id]: event.target.value
                                        })}
                                    >
                                        <option value="">Selecione um item do backlog</option>
                                        {panel.candidatos.map((item) => (
                                            <option key={item.id} value={item.id}>{item.chave} — {item.titulo}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={!candidateBySprint[panel.ativa.id] || saving}
                                        onClick={() => run(
                                            () => addSprintItem({
                                                sprintId: panel.ativa.id,
                                                itemId: candidateBySprint[panel.ativa.id],
                                                versao: panel.ativa.versao
                                            }),
                                            "Item adicionado à sprint ativa."
                                        )}
                                    >
                                        <FaPlus /> Adicionar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="sprint-empty">
                        <FaPlay />
                        <h3>Nenhuma sprint ativa</h3>
                        <p>Inicie uma sprint planejada para acompanhar seu quadro de execução.</p>
                    </div>
                )
            ) : (
                <div className="sprint-history">
                    {!panel.historico.length && (
                        <div className="sprint-empty">
                            <FaHistory />
                            <h3>Histórico vazio</h3>
                            <p>Sprints concluídas ou canceladas aparecerão aqui.</p>
                        </div>
                    )}
                    {panel.historico.map((sprint) => (
                        <article className="sprint-history-card" key={sprint.id}>
                            <header>
                                <div>
                                    <span className={`sprint-status status-${sprint.status.toLowerCase()}`}>
                                        {SPRINT_STATUS[sprint.status]}
                                    </span>
                                    <h3>{sprint.nome}</h3>
                                    <small>{formatDate(sprint.inicioPrevistoEm)} a {formatDate(sprint.fimPrevistoEm)}</small>
                                </div>
                                <div className="sprint-history-metrics">
                                    <span><strong>{sprint.escopoInicialItens || 0}</strong> escopo inicial</span>
                                    <span><strong>{sprint.itensConcluidos || 0}</strong> concluídos</span>
                                    <span><strong>+{sprint.itensAdicionadosAposInicio}</strong> adicionados</span>
                                    <span><strong>-{sprint.itensRetiradosAposInicio}</strong> retirados</span>
                                </div>
                            </header>
                            {sprint.resultado && <p className="sprint-result">{sprint.resultado}</p>}
                            <ScopeList sprint={sprint} canPlan={false} onRemove={() => {}} />
                        </article>
                    ))}
                </div>
            )}

            {modal?.type === "FORM" && (
                <SprintFormModal
                    sprint={modal.sprint}
                    saving={saving}
                    error={modalError}
                    onClose={() => setModal(null)}
                    onSubmit={submitSprint}
                />
            )}
            {modal?.type === "COMPLETE" && (
                <CompleteModal
                    sprint={modal.sprint}
                    planned={panel.planejadas}
                    saving={saving}
                    error={modalError}
                    onClose={() => setModal(null)}
                    onSubmit={(values) => run(
                        () => completeSprint({
                            id: modal.sprint.id,
                            versao: modal.sprint.versao,
                            destinoIncompletos: values.destinoIncompletos,
                            sprintDestinoId: values.destinoIncompletos === "SPRINT"
                                ? values.sprintDestinoId
                                : null,
                            resultado: values.resultado || null
                        }),
                        "Sprint concluída.",
                        true
                    )}
                />
            )}
        </section>
    );
}
