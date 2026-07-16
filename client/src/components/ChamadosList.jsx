import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    alterarStatusChamado,
    getAcompanhantesElegiveisChamado,
    getCategoriasChamado,
    getPrioridadesChamado,
    getResponsaveisFiltroChamado,
    getTiposChamado
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ChamadoDetail from "./ChamadoDetail";
import ChamadoSlaIndicator, { chamadoSlaDeadline } from "./ChamadoSlaIndicator";
import {
    archivedKanbanStatusOptions,
    formatDateTime,
    prioridadeClassName,
    prioridadeLabel,
    chamadoBadgeColorStyle,
    statusClassName,
    statusLabel,
    kanbanFilterStatusOptions,
    kanbanStatusOptions,
    tipoClassName,
    tipoLabel
} from "./chamadoLabels";

import "../styles/chamados.css";

const KANBAN_PAGE_SIZE = 100;

const initialFilters = {
    termo: "",
    status: "",
    prioridadeId: "",
    categoriaId: "",
    responsavelId: "",
    responsavelGrupoId: "",
    solicitanteId: "",
    criadoDe: "",
    criadoAte: ""
};

const chamadoResponsavelLabel = (chamado) => chamado.responsavelGrupoNome || chamado.responsavelNome || "Sem responsavel";
const chamadoAtendimentoLabel = (chamado) => chamado.liderAtendimentoNome ? ` Ãƒâ€šÃ‚Â· Atendimento: ${chamado.liderAtendimentoNome}` : "";
const responsavelOptionLabel = (responsavel) => responsavel.responsavelNome || responsavel.usuarioNome || responsavel.grupoNome || "Responsavel";

const uniqueResponsaveisBy = (responsaveis, keySelector) => {
    const map = new Map();

    for (const responsavel of responsaveis) {
        const key = keySelector(responsavel);

        if (key && !map.has(key)) {
            map.set(key, responsavel);
        }
    }

    return Array.from(map.values()).sort((a, b) => responsavelOptionLabel(a).localeCompare(responsavelOptionLabel(b)));
};

function ChamadoCard({
    chamado,
    onOpen,
    compact = false,
    draggable = false,
    isDragging = false,
    onDragStart,
    onDragEnd,
    currentUserId,

}) {
    const handleOpen = () => {
        onOpen(chamado.id);
    };
    const isAcompanhando = !!currentUserId && chamado.solicitanteId !== currentUserId && chamado.acompanhantes?.some((acompanhante) => acompanhante.ativo !== false && acompanhante.usuarioId === currentUserId);

    const handleKeyDown = (event) => {
        if (event.target !== event.currentTarget) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpen();
        }
    };


    return (
        <article
            key={chamado.id}
            className={"chamado-card" + (compact ? " chamado-card-compact" : "") + (isDragging ? " chamado-card-dragging" : "") + (chamado.slaStatus === "ATRASADO" ? " chamado-card-sla-atrasado" : "")}
            role="button"
            tabIndex={0}
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            draggable={draggable}
            onDragStart={(event) => {
                if (event.target.closest?.("button")) {
                    event.preventDefault();
                    return;
                }

                onDragStart?.(event, chamado);
            }}
            onDragEnd={onDragEnd}
        >
            <div className="chamado-card-header">
                <strong>{chamado.titulo}</strong>
            </div>
            <span className="chamado-card-meta">
                <span className={tipoClassName(chamado.tipoId)} style={chamadoBadgeColorStyle(chamado.tipoCor)}>{chamado.tipoNome || tipoLabel(chamado.tipoId)}</span>
                <span className={statusClassName(chamado.status)}>{statusLabel(chamado.status)}</span>
                <span className={prioridadeClassName(chamado.prioridadeId)} style={chamadoBadgeColorStyle(chamado.prioridadeCor)}>{chamado.prioridadeNome || prioridadeLabel(chamado.prioridadeId)}</span>
                {isAcompanhando && <span className="chamado-badge-acompanhando">Acompanhando</span>}
            </span>
            <small>
                Solicitante: {chamado.solicitanteNome || "-"} - Responsavel: {chamadoResponsavelLabel(chamado)}
            </small>
            <small>Atualizado em {formatDateTime(chamado.atualizadoEm)}</small>
        </article>
    );
}
export default function ChamadosList({ title, description, areaSlug, loadChamados, permissions, mode }) {
    const navigate = useNavigate();
    const { itemId } = useParams();
    const { user } = useAuth();
    const [filters, setFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ items: [], total: 0, page: 1, pageSize: KANBAN_PAGE_SIZE });
    const [categorias, setCategorias] = useState([]);
    const [responsaveis, setResponsaveis] = useState([]);
    const [solicitantes, setSolicitantes] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const kanbanRef = useRef(null);
    const kanbanTopScrollRef = useRef(null);
    const isSyncingKanbanScrollRef = useRef(false);
    const [kanbanScrollWidth, setKanbanScrollWidth] = useState(0);
    const [draggedChamado, setDraggedChamado] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [movingChamadoId, setMovingChamadoId] = useState(null);

    const pageSize = KANBAN_PAGE_SIZE;
    const isArchivedMode = mode === "arquivados";
    const kanbanColumns = isArchivedMode ? archivedKanbanStatusOptions : kanbanStatusOptions;
    const canMoveKanbanCards = mode === "painel" && canUseFeatureAction(user, permissions, "alterar_status");
    const responsaveisUsuarios = useMemo(() => uniqueResponsaveisBy(
        responsaveis.filter((responsavel) => responsavel.tipo === "USUARIO" && responsavel.usuarioId),
        (responsavel) => responsavel.usuarioId
    ), [responsaveis]);
    const responsaveisGrupos = useMemo(() => uniqueResponsaveisBy(
        responsaveis.filter((responsavel) => responsavel.tipo === "GRUPO" && responsavel.grupoId),
        (responsavel) => responsavel.grupoId
    ), [responsaveis]);


    const filtro = useMemo(() => ({
        termo: filters.termo.trim() || null,
        status: filters.status || null,
        prioridadeId: filters.prioridadeId ? Number(filters.prioridadeId) : null,
        categoriaId: filters.categoriaId ? Number(filters.categoriaId) : null,
        responsavelId: filters.responsavelId || null,
        responsavelGrupoId: filters.responsavelGrupoId ? Number(filters.responsavelGrupoId) : null,
        solicitanteId: filters.solicitanteId || null,
        criadoDe: filters.criadoDe || null,
        criadoAte: filters.criadoAte || null,
        page,
        pageSize
    }), [filters, page, pageSize]);

    const visibleKanbanColumns = useMemo(() => {
        if (!filters.status) {
            return kanbanColumns;
        }

        return kanbanColumns.filter((column) => column.value === filters.status);
    }, [filters.status, kanbanColumns]);

    const orderedItems = useMemo(() => {
        if (filters.ordenacao !== "VENCIMENTO_SLA") {
            return result.items;
        }

        return [...result.items].sort((left, right) => {
            const leftDeadline = chamadoSlaDeadline(left);
            const rightDeadline = chamadoSlaDeadline(right);
            const leftTime = leftDeadline ? new Date(leftDeadline).getTime() : Number.MAX_SAFE_INTEGER;
            const rightTime = rightDeadline ? new Date(rightDeadline).getTime() : Number.MAX_SAFE_INTEGER;
            return leftTime - rightTime;
        });
    }, [result.items, filters.ordenacao]);

    const chamadosPorStatus = useMemo(() => {
        const grouped = Object.fromEntries(kanbanColumns.map((column) => [column.value, []]));

        for (const chamado of orderedItems) {
            if (grouped[chamado.status]) {
                grouped[chamado.status].push(chamado);
            }
        }

        return grouped;
    }, [orderedItems, kanbanColumns]);

    const load = async () => {
        setError("");
        setLoading(true);

        try {
            setResult(await loadChamados(filtro));
        } catch (loadError) {
            setResult({ items: [], total: 0, page: 1, pageSize });
            setError(loadError.message || "Nao foi possivel carregar chamados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        const loadFilterOptions = async () => {
            try {
                const [categoriasResponse, prioridadesResponse, tiposResponse, solicitantesResponse, responsaveisResponse] = await Promise.all([
                    getCategoriasChamado(true),
                    getPrioridadesChamado(true),
                    getTiposChamado(true),
                    getAcompanhantesElegiveisChamado(),
                    getResponsaveisFiltroChamado()
                ]);

                if (active) {
                    setCategorias(categoriasResponse);
                    setPrioridades(prioridadesResponse);
                    setTipos(tiposResponse);
                    setSolicitantes(solicitantesResponse);
                    setResponsaveis(responsaveisResponse);
                }
            } catch {
                if (active) {
                    setCategorias([]);
                    setPrioridades([]);
                    setTipos([]);
                    setSolicitantes([]);
                    setResponsaveis([]);
                }
            }
        };

        void loadFilterOptions();

        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        if (!itemId) {
            void load();
        }
    }, [itemId, filtro]);

    useEffect(() => {
        const updateKanbanScrollWidth = () => {
            setKanbanScrollWidth(kanbanRef.current?.scrollWidth || 0);
        };

        updateKanbanScrollWidth();
        window.addEventListener("resize", updateKanbanScrollWidth);

        return () => window.removeEventListener("resize", updateKanbanScrollWidth);
    }, [result.items.length, visibleKanbanColumns.length]);

    const releaseKanbanScrollSync = () => {
        window.requestAnimationFrame(() => {
            isSyncingKanbanScrollRef.current = false;
        });
    };

    const syncKanbanFromTopScroll = (event) => {
        if (!kanbanRef.current || isSyncingKanbanScrollRef.current) {
            return;
        }

        isSyncingKanbanScrollRef.current = true;
        kanbanRef.current.scrollLeft = event.currentTarget.scrollLeft;
        releaseKanbanScrollSync();
    };

    const syncTopScrollFromKanban = (event) => {
        if (!kanbanTopScrollRef.current || isSyncingKanbanScrollRef.current) {
            return;
        }

        isSyncingKanbanScrollRef.current = true;
        kanbanTopScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
        releaseKanbanScrollSync();
    };

    const scrollKanban = (direction) => {
        if (!kanbanRef.current) {
            return;
        }

        const kanban = kanbanRef.current;
        const scrollAmount = window.innerWidth * 0.5;
        const maxScrollLeft = kanban.scrollWidth - kanban.clientWidth;
        const targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, kanban.scrollLeft + direction * scrollAmount));

        kanban.scrollTo({
            left: targetScrollLeft,
            behavior: "smooth"
        });
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
            ...(name === "responsavelId" && value ? { responsavelGrupoId: "" } : {}),
            ...(name === "responsavelGrupoId" && value ? { responsavelId: "" } : {})
        }));
        setPage(1);
    };

    const handleKanbanDragStart = (event, chamado) => {
        if (!canMoveKanbanCards || movingChamadoId) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", chamado.id);
        setDraggedChamado(chamado);
    };

    const handleKanbanDragEnd = () => {
        setDraggedChamado(null);
        setDragOverStatus(null);
    };

    const handleKanbanDragOver = (event, status) => {
        if (!draggedChamado || draggedChamado.status === status || movingChamadoId) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOverStatus(status);
    };

    const handleKanbanDrop = async (event, status) => {
        event.preventDefault();

        const chamadoId = event.dataTransfer.getData("text/plain") || draggedChamado?.id;
        const chamado = result.items.find((item) => item.id === chamadoId) || draggedChamado;

        setDragOverStatus(null);
        setDraggedChamado(null);

        if (!chamado || chamado.status === status || movingChamadoId) {
            return;
        }

        if (!canMoveKanbanCards) {
            setError("Seu grupo nao possui permissao para alterar status pelo Kanban.");
            return;
        }

        setError("");
        setMovingChamadoId(chamado.id);

        try {
            const updated = await alterarStatusChamado({
                chamadoId: chamado.id,
                status,
                observacao: "Status alterado pelo Kanban."
            });

            setResult((current) => ({
                ...current,
                items: current.items.map((item) => (item.id === updated.id ? updated : item))
            }));
        } catch (dropError) {
            setError(dropError.message || "Nao foi possivel mover o chamado no Kanban.");
            void load();
        } finally {
            setMovingChamadoId(null);
        }
    };


    const openDetail = (id) => {
        navigate(`/hub/controle-de-chamados/${areaSlug}/${id}`);
    };

    if (itemId) {
        return (
            <ChamadoDetail
                chamadoId={itemId}
                mode={mode}
                permissions={permissions}
                onBack={() => navigate(`/hub/controle-de-chamados/${areaSlug}`)}
            />
        );
    }

    return (
        <section className="chamados-shell">
            <header className="chamados-header">
                <div>
                    <span className="workspace-label">Controle de chamados</span>
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
            </header>

            {error && <div className="user-management-error" role="alert">{error}</div>}

            <div className="chamados-filters">
                <label>
                    <span>Buscar</span>
                    <input
                        type="search"
                        name="termo"
                        value={filters.termo}
                        onChange={handleFilterChange}
                        placeholder="Titulo ou descricao"
                    />
                </label>

                {!isArchivedMode && (
                    <label>
                        <span>Status</span>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            {kanbanFilterStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                )}

                <label>
                    <span>Prioridade</span>
                    <select name="prioridadeId" value={filters.prioridadeId} onChange={handleFilterChange}>
                        {[{ value: "", label: "Todas" }, ...prioridades.map((item) => ({ value: item.id, label: item.nome }))].map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Categoria</span>
                    <select name="categoriaId" value={filters.categoriaId} onChange={handleFilterChange}>
                        <option value="">Todas</option>
                        {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Responsavel usuario</span>
                    <select name="responsavelId" value={filters.responsavelId} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {responsaveisUsuarios.map((responsavel) => (
                            <option key={responsavel.usuarioId} value={responsavel.usuarioId}>{responsavelOptionLabel(responsavel)}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Grupo responsavel</span>
                    <select name="responsavelGrupoId" value={filters.responsavelGrupoId} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {responsaveisGrupos.map((responsavel) => (
                            <option key={responsavel.grupoId} value={responsavel.grupoId}>{responsavelOptionLabel(responsavel)}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Solicitante</span>
                    <select name="solicitanteId" value={filters.solicitanteId} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {solicitantes.map((solicitante) => (
                            <option key={solicitante.id} value={solicitante.id}>{solicitante.nome || solicitante.login || solicitante.email}</option>
                        ))}
                    </select>
                </label>

                                {mode === "painel" && (
                    <>
                        <label>
                            <span>SLA</span>
                            <select name="somenteAtrasados" value={filters.somenteAtrasados} onChange={handleFilterChange}>
                                <option value="">Todos</option>
                                <option value="true">Somente atrasados</option>
                            </select>
                        </label>
                        <label>
                            <span>Ordenacao</span>
                            <select name="ordenacao" value={filters.ordenacao} onChange={handleFilterChange}>
                                <option value="ATUALIZACAO">Mais recentes</option>
                                <option value="VENCIMENTO_SLA">Vencimento do SLA</option>
                            </select>
                        </label>
                    </>
                )}
<label>
                    <span>De</span>
                    <input type="date" name="criadoDe" value={filters.criadoDe} onChange={handleFilterChange} />
                </label>

                <label>
                    <span>Ate</span>
                    <input type="date" name="criadoAte" value={filters.criadoAte} onChange={handleFilterChange} />
                </label>
            </div>

            {loading ? (
                <div className="user-management-loading">Carregando chamados...</div>
            ) : result.items.length ? (
                <div className="chamado-kanban-shell">
                    <div
                        className="chamado-kanban-top-scroll"
                        ref={kanbanTopScrollRef}
                        onScroll={syncKanbanFromTopScroll}
                        aria-hidden="true"
                    >
                        <div style={{ width: `${kanbanScrollWidth}px` }} />
                    </div>

                    <button
                        type="button"
                        className="chamado-kanban-arrow chamado-kanban-arrow-left"
                        onClick={() => scrollKanban(-1)}
                        aria-label="Mover Kanban para a esquerda"
                    >
                        &lsaquo;
                    </button>

                    <div className="chamado-kanban" ref={kanbanRef} onScroll={syncTopScrollFromKanban} aria-label="Chamados por status">
                        {visibleKanbanColumns.map((column) => {
                            const columnItems = chamadosPorStatus[column.value] || [];

                            return (
                                <section
                                    key={column.value}
                                    className={`chamado-kanban-column${dragOverStatus === column.value ? " chamado-kanban-column-over" : ""}`}
                                    onDragOver={(event) => handleKanbanDragOver(event, column.value)}
                                    onDragLeave={() => setDragOverStatus((current) => (current === column.value ? null : current))}
                                    onDrop={(event) => handleKanbanDrop(event, column.value)}
                                >
                                    <header>
                                        <span className={statusClassName(column.value)}>{column.label}</span>
                                        <small>{columnItems.length}</small>
                                    </header>

                                    <div className="chamado-kanban-cards">
                                        {columnItems.length ? (
                                            columnItems.map((chamado) => (
                                                <ChamadoCard
                                                    key={chamado.id}
                                                    chamado={chamado}
                                                    onOpen={openDetail}
                                                    compact
                                                    draggable={canMoveKanbanCards && movingChamadoId !== chamado.id}
                                                    isDragging={draggedChamado?.id === chamado.id || movingChamadoId === chamado.id}
                                                    onDragStart={handleKanbanDragStart}
                                                    onDragEnd={handleKanbanDragEnd}
                                                    currentUserId={user?.id || user?.sub}
                                                />
                                            ))
                                        ) : (
                                            <p className="chamado-kanban-empty">Sem chamados neste status.</p>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        className="chamado-kanban-arrow chamado-kanban-arrow-right"
                        onClick={() => scrollKanban(1)}
                        aria-label="Mover Kanban para a direita"
                    >
                        &rsaquo;
                    </button>
                </div>
            ) : (
                <div className="chamado-empty">Nenhum chamado encontrado para os filtros atuais.</div>
            )}

            <footer className="chamados-pagination">
                <span>
                    {result.total} chamado(s)
                    {result.total > result.items.length ? ` Ãƒâ€šÃ‚Â· exibindo ${result.items.length} mais recentes no Kanban` : ""}
                </span>
            </footer>
        </section>
    );
}
