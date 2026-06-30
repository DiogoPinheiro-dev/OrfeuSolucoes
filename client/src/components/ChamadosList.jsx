import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChamadoDetail from "./ChamadoDetail";
import {
    formatDateTime,
    prioridadeClassName,
    prioridadeLabel,
    prioridadeOptions,
    statusClassName,
    statusLabel,
    statusOptions,
    tipoClassName,
    tipoLabel
} from "./chamadoLabels";

import "../styles/chamados.css";

const pageSize = 20;

const initialFilters = {
    termo: "",
    status: "",
    prioridade: ""
};

export default function ChamadosList({ title, description, areaSlug, loadChamados, permissions, mode }) {
    const navigate = useNavigate();
    const { itemId } = useParams();
    const [filters, setFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ items: [], total: 0, page: 1, pageSize });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const filtro = useMemo(() => ({
        termo: filters.termo.trim() || null,
        status: filters.status || null,
        prioridade: filters.prioridade || null,
        page,
        pageSize
    }), [filters, page]);

    const load = async () => {
        setError("");
        setLoading(true);

        try {
            setResult(await loadChamados(filtro));
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar chamados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!itemId) {
            void load();
        }
    }, [itemId, filtro]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value
        }));
        setPage(1);
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

    const totalPages = Math.max(1, Math.ceil((result.total || 0) / pageSize));

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
                        placeholder="Numero, titulo ou descricao"
                    />
                </label>

                <label>
                    <span>Status</span>
                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Prioridade</span>
                    <select name="prioridade" value={filters.prioridade} onChange={handleFilterChange}>
                        {prioridadeOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>
            </div>

            {loading ? (
                <div className="user-management-loading">Carregando chamados...</div>
            ) : result.items.length ? (
                <div className="chamado-list">
                    {result.items.map((chamado) => (
                        <button key={chamado.id} type="button" className="chamado-card" onClick={() => openDetail(chamado.id)}>
                            <span className="chamado-number">#{chamado.numero}</span>
                            <strong>{chamado.titulo}</strong>
                            <span className="chamado-card-meta">
                                <span className={tipoClassName(chamado.tipo)}>
                                    {tipoLabel(chamado.tipo)}
                                </span>
                                <span className={statusClassName(chamado.status)}>
                                    {statusLabel(chamado.status)}
                                </span>
                                <span className={prioridadeClassName(chamado.prioridade)}>
                                    {prioridadeLabel(chamado.prioridade)}
                                </span>
                            </span>
                            <small>
                                Solicitante: {chamado.solicitanteNome || "-"} · Responsavel: {chamado.responsavelNome || "Sem responsavel"}
                            </small>
                            <small>Atualizado em {formatDateTime(chamado.atualizadoEm)}</small>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="chamado-empty">Nenhum chamado encontrado para os filtros atuais.</div>
            )}

            <footer className="chamados-pagination">
                <span>{result.total} chamado(s)</span>
                <div>
                    <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                        Anterior
                    </button>
                    <span>Pagina {page} de {totalPages}</span>
                    <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                        Proxima
                    </button>
                </div>
            </footer>
        </section>
    );
}
