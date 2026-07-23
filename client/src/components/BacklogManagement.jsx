import { useCallback, useEffect, useMemo, useState } from "react";
import { FaArchive, FaEdit, FaEye, FaPlus, FaUndoAlt } from "react-icons/fa";

import {
    alterarStatusBacklogItem,
    arquivarBacklogItem,
    createBacklogItem,
    getBacklogItem,
    getBacklogItemHistorico,
    getBacklogItens,
    getBacklogProjetos,
    getBacklogResponsaveis,
    moverBacklogItem,
    reativarBacklogItem,
    updateBacklogItem
} from "../../services/Projetos/BacklogService";
import "../styles/backlogManagement.css";
import BacklogItemModal from "./BacklogItemModal";

const TIPOS = { HISTORIA: "História", TAREFA: "Tarefa", BUG: "Bug", MELHORIA: "Melhoria" };
const PRIORIDADES = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };
const STATUS = {
    ABERTO: "Aberto",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado"
};
const GROUP_LABELS = {
    status: STATUS,
    tipo: TIPOS,
    prioridade: PRIORIDADES
};
const DIRECTIONS = {
    TOPO: { label: "Mover para o topo", symbol: "⇈" },
    SUBIR: { label: "Subir uma posição", symbol: "↑" },
    DESCER: { label: "Descer uma posição", symbol: "↓" },
    FUNDO: { label: "Mover para o fim", symbol: "⇊" }
};

const EMPTY_FILTERS = {
    tipo: "",
    status: "",
    prioridade: "",
    responsavelId: "",
    incluirArquivados: false
};
const userLabel = (user) => user?.nome || user?.login || user?.email || "Não atribuído";
const estimateLabel = (minutes) => {
    if (minutes === null || minutes === undefined) return "—";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
};

function useDebouncedValue(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(timer);
    }, [delay, value]);
    return debounced;
}

function applyLocalMove(rows, itemId, direction) {
    const from = rows.findIndex((item) => item.id === itemId);
    if (from < 0) return rows;
    const target = direction === "TOPO"
        ? 0
        : direction === "FUNDO"
            ? rows.length - 1
            : direction === "SUBIR"
                ? Math.max(0, from - 1)
                : Math.min(rows.length - 1, from + 1);
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    return next.map((item, index) => ({ ...item, ordemBacklog: index + 1 }));
}

export default function BacklogManagement() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [includeArchivedProjects, setIncludeArchivedProjects] = useState(false);
    const [rows, setRows] = useState([]);
    const [responsaveis, setResponsaveis] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [groupBy, setGroupBy] = useState("");
    const [page, setPage] = useState({
        pagina: 1,
        limite: 100,
        total: 0,
        totalPaginas: 0,
        backlogVersao: 0,
        permissoes: {}
    });
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [movingId, setMovingId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [history, setHistory] = useState([]);
    const [modalError, setModalError] = useState("");

    const selectedProject = projects.find((project) => project.id === projectId);
    const projectArchived = !!selectedProject?.arquivadoEm;
    const hasActiveFilters = !!(
        debouncedSearch ||
        filters.tipo ||
        filters.status ||
        filters.prioridade ||
        filters.responsavelId ||
        filters.incluirArquivados
    );
    const reorderSafe = !projectArchived &&
        !hasActiveFilters &&
        !groupBy &&
        page.pagina === 1 &&
        page.totalPaginas <= 1 &&
        page.permissoes?.podePriorizar === true;

    const loadProjects = useCallback(async () => {
        setLoadingProjects(true);
        setError("");
        try {
            const result = await getBacklogProjetos(includeArchivedProjects);
            setProjects(result);
            setProjectId((current) => result.some((item) => item.id === current)
                ? current
                : result[0]?.id || "");
        } catch (loadError) {
            setProjects([]);
            setProjectId("");
            setError(loadError.message);
        } finally {
            setLoadingProjects(false);
        }
    }, [includeArchivedProjects]);

    const loadItems = useCallback(async () => {
        if (!projectId) {
            setRows([]);
            return;
        }
        setLoading(true);
        setError("");
        try {
            const result = await getBacklogItens({
                projetoId: projectId,
                pagina: page.pagina,
                limite: page.limite,
                termo: debouncedSearch || undefined,
                tipo: filters.tipo || undefined,
                status: filters.status || undefined,
                prioridade: filters.prioridade || undefined,
                responsavelId: filters.responsavelId || undefined,
                incluirArquivados: filters.incluirArquivados
            });
            setRows(result.items || []);
            setPage((current) => ({
                ...current,
                pagina: result.pagina,
                limite: result.limite,
                total: result.total,
                totalPaginas: result.totalPaginas,
                backlogVersao: result.backlogVersao,
                permissoes: result.permissoes || {}
            }));
        } catch (loadError) {
            setRows([]);
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filters, page.limite, page.pagina, projectId]);

    useEffect(() => { loadProjects(); }, [loadProjects]);
    useEffect(() => { loadItems(); }, [loadItems]);
    useEffect(() => {
        if (!projectId) {
            setResponsaveis([]);
            return;
        }
        getBacklogResponsaveis(projectId)
            .then(setResponsaveis)
            .catch((loadError) => setError(loadError.message));
    }, [projectId]);
    useEffect(() => {
        if (!notice) return undefined;
        const timer = window.setTimeout(() => setNotice(""), 4500);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const changeFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
        setPage((current) => ({ ...current, pagina: 1 }));
    };

    const groups = useMemo(() => {
        if (!groupBy) return [{ key: "todos", label: "", items: rows }];
        const grouped = new Map();
        for (const item of rows) {
            const key = item[groupBy] || "SEM_VALOR";
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(item);
        }
        return [...grouped.entries()].map(([key, items]) => ({
            key,
            label: GROUP_LABELS[groupBy]?.[key] || key,
            items
        }));
    }, [groupBy, rows]);

    const openCreate = () => {
        setModalError("");
        setHistory([]);
        setModal({ mode: "create", item: null });
    };

    const openItem = async (row, mode) => {
        setModalError("");
        setHistory([]);
        setModal({ mode, item: row, loading: true });
        try {
            const [item, itemHistory] = await Promise.all([
                getBacklogItem(row.id),
                mode === "view" ? getBacklogItemHistorico(row.id) : Promise.resolve([])
            ]);
            setModal({ mode, item, loading: false });
            setHistory(itemHistory);
        } catch (loadError) {
            setModalError(loadError.message);
            setModal((current) => current ? { ...current, loading: false } : null);
        }
    };

    const saveItem = async (form) => {
        setSaving(true);
        setModalError("");
        try {
            if (modal.mode === "create") {
                await createBacklogItem({ projetoId: projectId, ...form });
                setNotice("Demanda criada com sucesso.");
            } else {
                const current = modal.item;
                const updated = await updateBacklogItem({
                    id: current.id,
                    versao: current.versao,
                    tipo: form.tipo,
                    titulo: form.titulo,
                    descricao: form.descricao,
                    prioridade: form.prioridade,
                    responsavelId: form.responsavelId,
                    paiId: form.paiId,
                    inicioPrevistoEm: form.inicioPrevistoEm,
                    fimPrevistoEm: form.fimPrevistoEm,
                    estimativaMinutos: form.estimativaMinutos
                });
                if (updated.status !== form.status) {
                    await alterarStatusBacklogItem({
                        id: updated.id,
                        versao: updated.versao,
                        status: form.status
                    });
                }
                setNotice("Demanda atualizada com sucesso.");
            }
            setModal(null);
            await loadItems();
        } catch (saveError) {
            setModalError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleArchive = async (item) => {
        const action = item.arquivadoEm ? "reativar" : "arquivar";
        if (!window.confirm(`Deseja ${action} ${item.chave}?`)) return;
        setLoading(true);
        setError("");
        try {
            if (item.arquivadoEm) {
                await reativarBacklogItem({ id: item.id, versao: item.versao });
            } else {
                await arquivarBacklogItem({ id: item.id, versao: item.versao });
            }
            setNotice(`Demanda ${item.arquivadoEm ? "reativada" : "arquivada"} com sucesso.`);
            await loadItems();
        } catch (actionError) {
            setError(actionError.message);
        } finally {
            setLoading(false);
        }
    };

    const move = async (item, direction) => {
        if (!reorderSafe || movingId) return;
        const previousRows = rows;
        const previousVersion = page.backlogVersao;
        setMovingId(item.id);
        setError("");
        setRows(applyLocalMove(rows, item.id, direction));
        try {
            const result = await moverBacklogItem({
                itemId: item.id,
                backlogVersao: previousVersion,
                direcao: direction
            });
            setPage((current) => ({ ...current, backlogVersao: result.backlogVersao }));
            setNotice(`${item.chave} priorizado com sucesso.`);
            await loadItems();
        } catch (moveError) {
            setRows(previousRows);
            setPage((current) => ({ ...current, backlogVersao: previousVersion }));
            setError(`${moveError.message} A ordem exibida foi restaurada.`);
        } finally {
            setMovingId("");
        }
    };

    const onRowKeyDown = (event, item) => {
        if (!event.altKey || !reorderSafe) return;
        const direction = event.key === "ArrowUp"
            ? "SUBIR"
            : event.key === "ArrowDown"
                ? "DESCER"
                : event.key === "Home"
                    ? "TOPO"
                    : event.key === "End"
                        ? "FUNDO"
                        : null;
        if (!direction) return;
        event.preventDefault();
        move(item, direction);
    };

    const parentOptions = rows.filter((item) =>
        !item.arquivadoEm &&
        item.id !== modal?.item?.id &&
        !item.paiId
    );

    return (
        <div className="backlog-management">
            <section className="crud-shell backlog-shell">
            <header className="crud-header backlog-heading">
                <div>
                    <span className="crud-kicker">Projetos</span>
                    <h2>Backlog de demandas</h2>
                    <p>Cadastre, filtre e priorize o trabalho operacional do projeto.</p>
                </div>
                <label className="crud-search">
                    <span>Pesquisar</span>
                    <input
                        type="search"
                        value={search}
                        placeholder="Chave, título ou descrição"
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage((current) => ({ ...current, pagina: 1 }));
                        }}
                    />
                </label>
            </header>

            {error && (
                <div className="backlog-alert" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={loadItems}>Tentar novamente</button>
                </div>
            )}
            {notice && <div className="backlog-notice" role="status">{notice}</div>}

            <section className="crud-filters backlog-toolbar" aria-label="Filtros do backlog">
                <label className="backlog-project-selector">
                    Projeto
                    <select
                        value={projectId}
                        disabled={loadingProjects}
                        onChange={(event) => {
                            setProjectId(event.target.value);
                            setPage((current) => ({ ...current, pagina: 1 }));
                        }}
                    >
                        {!projects.length && <option value="">Nenhum projeto disponível</option>}
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.chave} — {project.nome}{project.arquivadoEm ? " (arquivado)" : ""}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Tipo
                    <select value={filters.tipo} onChange={(event) => changeFilter("tipo", event.target.value)}>
                        <option value="">Todos</option>
                        {Object.entries(TIPOS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                <label>
                    Status
                    <select value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}>
                        <option value="">Todos</option>
                        {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                <label>
                    Prioridade
                    <select value={filters.prioridade} onChange={(event) => changeFilter("prioridade", event.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(PRIORIDADES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                <label>
                    Responsável
                    <select value={filters.responsavelId} onChange={(event) => changeFilter("responsavelId", event.target.value)}>
                        <option value="">Todos</option>
                        {responsaveis.map((user) => <option key={user.id} value={user.id}>{userLabel(user)}</option>)}
                    </select>
                </label>
                <label>
                    Agrupar
                    <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                        <option value="">Sem agrupamento</option>
                        <option value="status">Status</option>
                        <option value="tipo">Tipo</option>
                        <option value="prioridade">Prioridade</option>
                    </select>
                </label>
                <label className="backlog-check">
                    <input
                        type="checkbox"
                        checked={filters.incluirArquivados}
                        onChange={(event) => changeFilter("incluirArquivados", event.target.checked)}
                    />
                    Itens arquivados
                </label>
                <label className="backlog-check">
                    <input
                        type="checkbox"
                        checked={includeArchivedProjects}
                        onChange={(event) => setIncludeArchivedProjects(event.target.checked)}
                    />
                    Projetos arquivados
                </label>
            </section>

            <div className="crud-toolbar" aria-label="Ações do backlog">
                <button
                    type="button"
                    onClick={openCreate}
                    disabled={!projectId || projectArchived || page.permissoes?.podeCriar !== true}
                    aria-label="Incluir demanda"
                    title="Incluir demanda"
                >
                    <FaPlus aria-hidden="true" />
                </button>
            </div>

            {projectArchived && (
                <div className="backlog-readonly" role="status">
                    Projeto arquivado: o backlog está disponível somente para consulta.
                </div>
            )}
            {!reorderSafe && projectId && rows.length > 1 && (
                <p className="backlog-reorder-help">
                    Para priorizar, remova filtros e agrupamentos e exiba o backlog completo em uma única página.
                </p>
            )}

            <div className="crud-table-wrap backlog-table-wrap" aria-busy={loading}>
                <table className="crud-table backlog-table">
                    <thead>
                        <tr>
                            <th scope="col">Ordem</th>
                            <th scope="col">Chave</th>
                            <th scope="col">Título</th>
                            <th scope="col">Tipo</th>
                            <th scope="col">Prioridade</th>
                            <th scope="col">Responsável</th>
                            <th scope="col">Status</th>
                            <th scope="col">Estimativa</th>
                            <th scope="col">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.flatMap((group) => [
                            groupBy ? (
                                <tr className="backlog-group-row" key={`group-${group.key}`}>
                                    <th colSpan="9" scope="rowgroup">{group.label} · {group.items.length}</th>
                                </tr>
                            ) : null,
                            ...group.items.map((item) => (
                                <tr
                                    key={item.id}
                                    tabIndex={reorderSafe ? 0 : undefined}
                                    onKeyDown={(event) => onRowKeyDown(event, item)}
                                    className={item.arquivadoEm ? "archived" : ""}
                                    aria-label={`${item.chave}, ${item.titulo}`}
                                >
                                    <td>
                                        <div className="backlog-order-actions">
                                            {Object.entries(DIRECTIONS).map(([direction, config]) => (
                                                <button
                                                    key={direction}
                                                    type="button"
                                                    title={config.label}
                                                    aria-label={`${config.label}: ${item.chave}`}
                                                    disabled={!reorderSafe || movingId === item.id}
                                                    onClick={() => move(item, direction)}
                                                >
                                                    {config.symbol}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td><strong>{item.chave}</strong></td>
                                    <td>
                                        <button type="button" className="backlog-title-button" onClick={() => openItem(item, "view")}>
                                            {item.titulo}
                                        </button>
                                        {item.arquivadoEm && <span className="backlog-archived-badge">Arquivado</span>}
                                    </td>
                                    <td>{TIPOS[item.tipo] || item.tipo}</td>
                                    <td><span className={`backlog-priority priority-${item.prioridade.toLowerCase()}`}>{PRIORIDADES[item.prioridade]}</span></td>
                                    <td>{userLabel(item.responsavel)}</td>
                                    <td><span className={`backlog-status status-${item.status.toLowerCase()}`}>{STATUS[item.status]}</span></td>
                                    <td>{estimateLabel(item.estimativaMinutos)}</td>
                                    <td>
                                        <div className="backlog-row-actions">
                                            <button type="button" onClick={() => openItem(item, "view")} aria-label={`Visualizar ${item.chave}`} title="Visualizar"><FaEye aria-hidden="true" /></button>
                                            {item.permissoes?.podeAlterar && (
                                                <button type="button" onClick={() => openItem(item, "edit")} aria-label={`Alterar ${item.chave}`} title="Alterar"><FaEdit aria-hidden="true" /></button>
                                            )}
                                            {(item.permissoes?.podeArquivar || item.permissoes?.podeReativar) && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleArchive(item)}
                                                    aria-label={`${item.arquivadoEm ? "Reativar" : "Arquivar"} ${item.chave}`}
                                                    title={item.arquivadoEm ? "Reativar" : "Arquivar"}
                                                >
                                                    {item.arquivadoEm ? <FaUndoAlt aria-hidden="true" /> : <FaArchive aria-hidden="true" />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ])}
                    </tbody>
                </table>
                {loading && <div className="crud-grid-loading" role="status" aria-live="polite"><span aria-hidden="true"></span><p>Processando...</p></div>}
                {!loading && projectId && !rows.length && (
                    <div className="backlog-state">Nenhuma demanda encontrada para os critérios informados.</div>
                )}
                {!loading && !projectId && (
                    <div className="backlog-state">Selecione ou cadastre um projeto para iniciar o backlog.</div>
                )}
            </div>

            <footer className="crud-pagination backlog-pagination">
                <span>{page.total} demanda(s) · Página {page.pagina} de {Math.max(page.totalPaginas, 1)}</span>
                <div>
                    <button
                        type="button"
                        disabled={loading || page.pagina <= 1}
                        onClick={() => setPage((current) => ({ ...current, pagina: current.pagina - 1 }))}
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        disabled={loading || page.pagina >= page.totalPaginas}
                        onClick={() => setPage((current) => ({ ...current, pagina: current.pagina + 1 }))}
                    >
                        Próxima
                    </button>
                </div>
            </footer>
            </section>

            {modal && !modal.loading && (
                <BacklogItemModal
                    mode={modal.mode}
                    item={modal.item}
                    history={history}
                    responsaveis={responsaveis}
                    parentOptions={parentOptions}
                    saving={saving}
                    error={modalError}
                    onClose={() => setModal(null)}
                    onSubmit={saveItem}
                />
            )}
            {modal?.loading && <div className="backlog-overlay-state" role="status">Carregando demanda...</div>}
        </div>
    );
}
