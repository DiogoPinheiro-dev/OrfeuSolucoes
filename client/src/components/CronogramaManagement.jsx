import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaArchive,
    FaArrowLeft,
    FaArrowRight,
    FaCompressAlt,
    FaEdit,
    FaExpandAlt,
    FaLink,
    FaPlus,
    FaTimes,
    FaUndoAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import {
    archiveDependencia,
    createDependencia,
    getCronograma,
    updateCronogramaItemDatas
} from "../../services/Projetos/CronogramaService";
import { getBacklogProjetos } from "../../services/Projetos/BacklogService";
import { useConfirmAction } from "../hooks/useConfirmAction";
import "../styles/cronogramaManagement.css";

const DAY = 86400000;
const TYPE_LABEL = { ITEM: "Item", MARCO: "Marco", ENTREGA: "Entrega" };
const GROUP_LABEL = {
    NENHUM: "Sem agrupamento",
    TIPO: "Tipo",
    STATUS: "Status",
    RESPONSAVEL: "Responsável"
};

const startOfDay = (value) => {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};
const addDays = (value, days) => new Date(startOfDay(value).getTime() + days * DAY);
const inputDate = (value) => value ? startOfDay(value).toISOString().slice(0, 10) : "";
const dateLabel = (value) => value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
    : "Sem data";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function Modal({ title, children, onClose }) {
    return (
        <div className="crud-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="crud-modal gantt-modal" role="dialog" aria-modal="true" aria-label={title}>
                <header className="crud-modal-header gantt-modal-header">
                    <div>
                        <span>Planejamento do cronograma</span>
                        <h3>{title}</h3>
                    </div>
                    <button className="crud-modal-close" type="button" onClick={onClose} aria-label="Fechar">
                        <FaTimes aria-hidden="true" />
                    </button>
                </header>
                {children}
            </section>
        </div>
    );
}

function DependencyEditor({ items, saving, error, onClose, onSubmit }) {
    const [form, setForm] = useState({ bloqueadorId: "", bloqueadoId: "" });
    const valid = form.bloqueadorId && form.bloqueadoId && form.bloqueadorId !== form.bloqueadoId;
    return (
        <Modal title="Incluir dependência" onClose={onClose}>
            <form onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit(form); }}>
                <div className="gantt-modal-form">
                    <label>
                        <span>Item que bloqueia</span>
                        <select value={form.bloqueadorId} onChange={(event) => setForm((current) => ({ ...current, bloqueadorId: event.target.value }))} required>
                            <option value="">Selecione</option>
                            {items.map((item) => <option key={item.id} value={item.id}>{item.chave} — {item.titulo}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>Item bloqueado</span>
                        <select value={form.bloqueadoId} onChange={(event) => setForm((current) => ({ ...current, bloqueadoId: event.target.value }))} required>
                            <option value="">Selecione</option>
                            {items.filter((item) => item.id !== form.bloqueadorId).map((item) => <option key={item.id} value={item.id}>{item.chave} — {item.titulo}</option>)}
                        </select>
                    </label>
                    <p>A relação criada será “bloqueia/é bloqueado por”. Ciclos e relações inválidas são rejeitados pelo servidor.</p>
                    {error && <div className="gantt-feedback error" role="alert">{error}</div>}
                </div>
                <footer className="crud-modal-actions">
                    <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" disabled={!valid || saving}>{saving ? "Salvando..." : "Incluir"}</button>
                </footer>
            </form>
        </Modal>
    );
}

function DateEditor({ item, saving, error, onClose, onSubmit }) {
    const [form, setForm] = useState({
        inicioPrevistoEm: inputDate(item.inicioEm),
        fimPrevistoEm: inputDate(item.fimEm)
    });
    return (
        <Modal title={`Editar período — ${item.chave}`} onClose={onClose}>
            <form onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
                <div className="gantt-modal-form two-columns">
                    <label><span>Início previsto</span><input type="date" value={form.inicioPrevistoEm} onChange={(event) => setForm((current) => ({ ...current, inicioPrevistoEm: event.target.value }))} /></label>
                    <label><span>Fim previsto</span><input type="date" value={form.fimPrevistoEm} onChange={(event) => setForm((current) => ({ ...current, fimPrevistoEm: event.target.value }))} /></label>
                    <p className="wide">A alteração será confirmada e auditada. O sistema não deslocará outros itens automaticamente; conflitos serão exibidos como inconsistências.</p>
                    {error && <div className="gantt-feedback error wide" role="alert">{error}</div>}
                </div>
                <footer className="crud-modal-actions">
                    <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" disabled={saving}>{saving ? "Confirmando..." : "Confirmar alteração"}</button>
                </footer>
            </form>
        </Modal>
    );
}

export default function CronogramaManagement() {
    const { requestConfirmation, confirmationDialog } = useConfirmAction();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [filters, setFilters] = useState({ inicioEm: "", fimEm: "", agrupamento: "NENHUM", incluirDependenciasArquivadas: false });
    const [panel, setPanel] = useState({ elementos: [], dependencias: [], inconsistencias: [], permissoes: {} });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [modalError, setModalError] = useState("");
    const [pixelsPerDay, setPixelsPerDay] = useState(24);

    useEffect(() => {
        getBacklogProjetos(true)
            .then((items) => {
                setProjects(items);
                setProjectId((current) => items.some((item) => item.id === current)
                    ? current
                    : items.find((item) => !item.arquivadoEm)?.id || items[0]?.id || "");
            })
            .catch((loadError) => setError(loadError.message));
    }, []);

    const load = useCallback(async () => {
        if (!projectId) { setLoading(false); return; }
        setLoading(true);
        setError("");
        try {
            setPanel(await getCronograma({
                projetoId: projectId,
                ...(filters.inicioEm ? { inicioEm: filters.inicioEm } : {}),
                ...(filters.fimEm ? { fimEm: filters.fimEm } : {}),
                agrupamento: filters.agrupamento,
                incluirDependenciasArquivadas: filters.incluirDependenciasArquivadas
            }));
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, [filters, projectId]);
    useEffect(() => { load(); }, [load]);

    const selectedProject = projects.find((item) => item.id === projectId);
    const itemCandidates = useMemo(
        () => panel.elementos.filter((item) => item.tipo === "ITEM" && !item.arquivado),
        [panel.elementos]
    );
    const range = useMemo(() => {
        const start = startOfDay(filters.inicioEm || panel.inicioEm || new Date());
        let end = startOfDay(filters.fimEm || panel.fimEm || addDays(start, 30));
        if (end.getTime() <= start.getTime()) end = addDays(start, 1);
        return { start, end, days: Math.max(2, Math.round((end - start) / DAY) + 1) };
    }, [filters.fimEm, filters.inicioEm, panel.fimEm, panel.inicioEm]);
    const timelineWidth = Math.max(720, range.days * pixelsPerDay);
    const rowHeight = 52;
    const rowPositions = useMemo(
        () => new Map(panel.elementos.map((item, index) => [item.id, index])),
        [panel.elementos]
    );
    const elementById = useMemo(
        () => new Map(panel.elementos.map((item) => [item.id, item])),
        [panel.elementos]
    );
    const axisDays = useMemo(() => {
        const step = pixelsPerDay >= 36 ? 2 : pixelsPerDay >= 20 ? 7 : 14;
        return Array.from({ length: range.days }, (_, index) => index)
            .filter((index) => index % step === 0);
    }, [pixelsPerDay, range.days]);

    const shiftRange = (direction) => {
        const span = range.days - 1;
        const offset = direction * Math.max(1, span);
        setFilters((current) => ({
            ...current,
            inicioEm: inputDate(addDays(range.start, offset)),
            fimEm: inputDate(addDays(range.end, offset))
        }));
    };

    const run = async (operation, message, close = true) => {
        setSaving(true);
        setModalError("");
        try {
            await operation();
            if (close) setModal(null);
            setNotice(message);
            await load();
        } catch (operationError) {
            if (modal) setModalError(operationError.message);
            else setError(operationError.message);
        } finally {
            setSaving(false);
        }
    };

    const openElement = (item) => {
        if (item.tipo === "ITEM") {
            navigate(`/hub/projetos/backlog-de-demandas?projetoId=${projectId}&itemId=${item.id}`);
        } else {
            navigate(`/hub/projetos/marcos-e-entregas?tipo=${item.tipo}&id=${item.id}`);
        }
    };

    return (
        <section className="gantt-management crud-shell">
            <header className="crud-header gantt-header">
                <div>
                    <span className="crud-kicker">Gestão operacional</span>
                    <h2>Cronograma e Gantt</h2>
                    <p>Visualize precedências, datas, compromissos e riscos sem reagendamento automático.</p>
                </div>
                <div className="gantt-summary" aria-label="Resumo do cronograma">
                    <span><strong>{panel.elementos.length}</strong> elementos</span>
                    <span><strong>{panel.dependencias.filter((item) => !item.arquivadoEm).length}</strong> dependências</span>
                    <span className={panel.inconsistencias.length ? "has-risk" : ""}><strong>{panel.inconsistencias.length}</strong> inconsistências</span>
                </div>
            </header>

            <div className="crud-filters gantt-filters">
                <label className="project"><span>Projeto</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}{project.arquivadoEm ? " (arquivado)" : ""}</option>)}</select></label>
                <label><span>De</span><input type="date" value={filters.inicioEm} onChange={(event) => setFilters((current) => ({ ...current, inicioEm: event.target.value }))} /></label>
                <label><span>Até</span><input type="date" value={filters.fimEm} onChange={(event) => setFilters((current) => ({ ...current, fimEm: event.target.value }))} /></label>
                <label><span>Agrupar</span><select value={filters.agrupamento} onChange={(event) => setFilters((current) => ({ ...current, agrupamento: event.target.value }))}>{Object.entries(GROUP_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="gantt-check"><input type="checkbox" checked={filters.incluirDependenciasArquivadas} onChange={(event) => setFilters((current) => ({ ...current, incluirDependenciasArquivadas: event.target.checked }))} />Dependências arquivadas</label>
                {selectedProject?.arquivadoEm && <span className="gantt-readonly">Projeto arquivado: somente leitura</span>}
            </div>

            {error && <div className="gantt-feedback error" role="alert">{error}</div>}
            {notice && <div className="gantt-feedback success" role="status">{notice}</div>}

            <div className="crud-toolbar gantt-toolbar">
                <button type="button" disabled={!panel.permissoes.podeGerenciarDependencias || itemCandidates.length < 2} onClick={() => { setModalError(""); setModal({ type: "dependency" }); }} title="Incluir dependência" aria-label="Incluir dependência"><FaPlus /></button>
                <span className="gantt-toolbar-divider" />
                <button type="button" onClick={() => shiftRange(-1)} title="Período anterior" aria-label="Período anterior"><FaArrowLeft /></button>
                <button type="button" onClick={() => setFilters((current) => ({ ...current, inicioEm: "", fimEm: "" }))} className="gantt-text-button">Todo o período</button>
                <button type="button" onClick={() => shiftRange(1)} title="Próximo período" aria-label="Próximo período"><FaArrowRight /></button>
                <span className="gantt-toolbar-divider" />
                <button type="button" onClick={() => setPixelsPerDay((value) => clamp(value - 8, 8, 48))} title="Reduzir zoom" aria-label="Reduzir zoom"><FaCompressAlt /></button>
                <button type="button" onClick={() => setPixelsPerDay((value) => clamp(value + 8, 8, 48))} title="Aumentar zoom" aria-label="Aumentar zoom"><FaExpandAlt /></button>
            </div>

            {!!panel.inconsistencias.length && (
                <section className="gantt-inconsistencies" aria-labelledby="gantt-inconsistency-title">
                    <h3 id="gantt-inconsistency-title">Inconsistências do cronograma</h3>
                    <ul>{panel.inconsistencias.map((item, index) => <li key={`${item.codigo}-${index}`} className={item.severidade.toLowerCase()}><strong>{item.severidade === "CRITICO" ? "Crítico" : "Aviso"}</strong><span>{item.mensagem}</span></li>)}</ul>
                </section>
            )}

            <div className="gantt-board" aria-busy={loading}>
                <div className="gantt-labels" aria-hidden="true">
                    <div className="gantt-axis-corner">Elemento</div>
                    {panel.elementos.map((item) => (
                        <button key={item.id} type="button" onClick={() => openElement(item)} title={`Abrir ${item.titulo}`}>
                            <span className={`gantt-type type-${item.tipo.toLowerCase()}`}>{TYPE_LABEL[item.tipo]}</span>
                            <strong>{item.chave || item.titulo}</strong>
                            <small>{item.grupo}</small>
                        </button>
                    ))}
                </div>
                <div className="gantt-scroll">
                    <div className="gantt-timeline" style={{ width: timelineWidth }}>
                        <div className="gantt-axis">
                            {axisDays.map((day) => <span key={day} style={{ left: day * pixelsPerDay }}>{dateLabel(addDays(range.start, day))}</span>)}
                        </div>
                        <div className="gantt-grid" style={{ height: panel.elementos.length * rowHeight }}>
                            {axisDays.map((day) => <i key={day} style={{ left: day * pixelsPerDay }} />)}
                            {panel.elementos.map((item, index) => {
                                const start = item.inicioEm ? Math.round((startOfDay(item.inicioEm) - range.start) / DAY) : null;
                                const end = item.fimEm ? Math.round((startOfDay(item.fimEm) - range.start) / DAY) : null;
                                const left = start === null ? 0 : start * pixelsPerDay;
                                const width = start === null || end === null ? 0 : Math.max(pixelsPerDay, (end - start + 1) * pixelsPerDay);
                                return (
                                    <div className="gantt-row" key={item.id} style={{ top: index * rowHeight, height: rowHeight }}>
                                        {item.semPeriodo ? (
                                            <button type="button" className="gantt-undated" onClick={() => item.tipo === "ITEM" && panel.permissoes.podeEditarDatas && setModal({ type: "dates", item })}>Sem período</button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={[
                                                    "gantt-bar",
                                                    `type-${item.tipo.toLowerCase()}`,
                                                    item.tipo === "MARCO" ? "milestone" : "",
                                                    item.bloqueado ? "blocked" : "",
                                                    item.riscoAtraso ? "risk" : "",
                                                    item.arquivado ? "archived" : ""
                                                ].filter(Boolean).join(" ")}
                                                style={{ left, width: item.tipo === "MARCO" ? pixelsPerDay : width }}
                                                onClick={() => openElement(item)}
                                                onDoubleClick={(event) => {
                                                    if (item.tipo === "ITEM" && panel.permissoes.podeEditarDatas && !item.arquivado) {
                                                        event.preventDefault();
                                                        setModal({ type: "dates", item });
                                                    }
                                                }}
                                                title={`${item.titulo}: ${dateLabel(item.inicioEm)} a ${dateLabel(item.fimEm)}`}
                                            >
                                                {item.tipo !== "MARCO" && <span style={{ width: `${item.progressoPercentual}%` }} />}
                                                <em>{item.chave || item.titulo}</em>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            <svg className="gantt-connectors" width={timelineWidth} height={panel.elementos.length * rowHeight} aria-hidden="true">
                                <defs><marker id="gantt-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
                                {panel.dependencias.filter((dependency) => !dependency.arquivadoEm).map((dependency) => {
                                    const from = elementById.get(dependency.bloqueador.id);
                                    const to = elementById.get(dependency.bloqueado.id);
                                    const fromRow = rowPositions.get(dependency.bloqueador.id);
                                    const toRow = rowPositions.get(dependency.bloqueado.id);
                                    if (!from?.fimEm || !to?.inicioEm || fromRow === undefined || toRow === undefined) return null;
                                    const x1 = (Math.round((startOfDay(from.fimEm) - range.start) / DAY) + 1) * pixelsPerDay;
                                    const x2 = Math.round((startOfDay(to.inicioEm) - range.start) / DAY) * pixelsPerDay;
                                    const y1 = fromRow * rowHeight + rowHeight / 2;
                                    const y2 = toRow * rowHeight + rowHeight / 2;
                                    const middle = Math.max(x1 + 10, (x1 + x2) / 2);
                                    return <path key={dependency.id} d={`M ${x1} ${y1} H ${middle} V ${y2} H ${x2}`} markerEnd="url(#gantt-arrow)" />;
                                })}
                            </svg>
                        </div>
                    </div>
                </div>
                {loading && <div className="crud-grid-loading"><span /><p>Montando cronograma...</p></div>}
            </div>

            <details className="gantt-accessible-table">
                <summary>Tabela equivalente do cronograma</summary>
                <div className="crud-table-wrap">
                    <table className="crud-table">
                        <thead><tr><th>Tipo</th><th>Elemento</th><th>Grupo</th><th>Início</th><th>Fim</th><th>Progresso</th><th>Situação</th><th>Ações</th></tr></thead>
                        <tbody>
                            {panel.elementos.map((item) => (
                                <tr key={item.id}>
                                    <td>{TYPE_LABEL[item.tipo]}</td><td>{item.chave ? `${item.chave} — ` : ""}{item.titulo}</td><td>{item.grupo}</td>
                                    <td>{dateLabel(item.inicioEm)}</td><td>{dateLabel(item.fimEm)}</td><td>{item.progressoPercentual}%</td>
                                    <td>{item.riscoAtraso ? "Risco de atraso" : item.bloqueado ? "Bloqueado" : item.semPeriodo ? "Sem período" : "Planejado"}</td>
                                    <td><div className="gantt-table-actions"><button type="button" onClick={() => openElement(item)}>Abrir</button>{item.tipo === "ITEM" && <button type="button" disabled={!panel.permissoes.podeEditarDatas || item.arquivado} onClick={() => setModal({ type: "dates", item })}><FaEdit /> Datas</button>}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>

            <section className="gantt-dependencies" aria-labelledby="gantt-dependencies-title">
                <header><div><h3 id="gantt-dependencies-title">Dependências</h3><p>Relações de precedência entre itens do projeto.</p></div><span>{panel.dependencias.length}</span></header>
                <div>
                    {panel.dependencias.map((dependency) => (
                        <article key={dependency.id} className={dependency.arquivadoEm ? "archived" : ""}>
                            <FaLink aria-hidden="true" />
                            <div><strong>{dependency.bloqueador.chave}</strong><span>{dependency.bloqueador.titulo}</span></div>
                            <b>bloqueia</b>
                            <div><strong>{dependency.bloqueado.chave}</strong><span>{dependency.bloqueado.titulo}</span></div>
                            <button
                                type="button"
                                disabled={!panel.permissoes.podeGerenciarDependencias}
                                onClick={async () => {
                                    const action = dependency.arquivadoEm ? "reativar" : "arquivar";
                                    if (!await requestConfirmation({
                                        title: dependency.arquivadoEm ? "Reativar dependência" : "Arquivar dependência",
                                        message: `Deseja ${action} esta dependência?`,
                                        confirmLabel: dependency.arquivadoEm ? "Reativar" : "Arquivar",
                                        variant: dependency.arquivadoEm ? "normal" : "warning"
                                    })) return;
                                    run(() => archiveDependencia({ id: dependency.id, versao: dependency.versao }, !!dependency.arquivadoEm), `Dependência ${dependency.arquivadoEm ? "reativada" : "arquivada"}.`, false);
                                }}
                                title={dependency.arquivadoEm ? "Reativar" : "Arquivar"}
                            >
                                {dependency.arquivadoEm ? <FaUndoAlt /> : <FaArchive />}
                            </button>
                        </article>
                    ))}
                    {!panel.dependencias.length && <p className="gantt-empty">Nenhuma dependência cadastrada.</p>}
                </div>
            </section>

            {modal?.type === "dependency" && <DependencyEditor items={itemCandidates} saving={saving} error={modalError} onClose={() => setModal(null)} onSubmit={(form) => run(() => createDependencia({ projetoId: projectId, ...form }), "Dependência incluída com sucesso.")} />}
            {modal?.type === "dates" && <DateEditor item={modal.item} saving={saving} error={modalError} onClose={() => setModal(null)} onSubmit={(form) => run(() => updateCronogramaItemDatas({ id: modal.item.id, versao: modal.item.versao, inicioPrevistoEm: form.inicioPrevistoEm || null, fimPrevistoEm: form.fimPrevistoEm || null }), "Período atualizado com sucesso.")} />}
            {confirmationDialog}
        </section>
    );
}
