import { useMemo, useRef } from "react";
import { FaEdit, FaEye, FaPlus, FaTrashAlt } from "react-icons/fa";

import { EmptyState, FeedbackMessage, LoadingState } from "./CrudFeedback";
import "../styles/crudGrid.css";

export default function CrudGrid({
    title,
    kicker = "Configurador",
    description = "",
    className = "",
    compact = false,
    columns,
    rows,
    selectedId,
    onSelect,
    onCreate,
    onEdit,
    onView,
    onDelete,
    search = "",
    onSearchChange,
    filters,
    pagination,
    paginationConfig,
    toolbarActions,
    emptyMessage = "Nenhum registro encontrado.",
    error = null,
    onRetry,
    retryLabel = "Tentar novamente",
    selectedIds = [],
    onToggleSelect,
    onToggleSelectAll,
    busy = false,
    canCreate = true,
    canEdit = true,
    canView = true,
    canDelete = true,
    showCreate = true,
    showEdit = true,
    showView = true,
    showDelete = true,
    deleteLabel = "Excluir selecionados",
    deleteSelectionReason = "Marque ao menos um registro para exclusão.",
    deleteIcon = null,
    selectable = true,
    disabledReasons = {},
    isRowSelectable = () => true,
    getRowSelectionDisabledReason = () => "Este registro não pode ser excluído.",
    getRowClassName = () => "",
    getRowId = (row) => row.id,
    getRowLabel = (row) => row.nome || row.email || "registro"
}) {
    const rowRefs = useRef(new Map());
    const structuredPagination = paginationConfig && !pagination;
    const paginationMode = paginationConfig?.mode || "server";
    const currentPage = Math.max(1, paginationConfig?.page || 1);
    const pageSize = Math.max(1, paginationConfig?.pageSize || rows.length || 1);
    const totalItems = paginationMode === "local" ? rows.length : Math.max(0, paginationConfig?.totalItems ?? rows.length);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const visibleRows = useMemo(() => {
        if (!structuredPagination || paginationMode !== "local") return rows;
        const start = (Math.min(currentPage, totalPages) - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [currentPage, pageSize, paginationMode, rows, structuredPagination, totalPages]);
    const selectedRow = rows.find((row) => getRowId(row) === selectedId);
    const selectedIdSet = new Set(selectedIds);
    const selectableRows = visibleRows.filter((row) => isRowSelectable(row));
    const allVisibleSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIdSet.has(getRowId(row)));
    const effectivePage = Math.min(currentPage, totalPages);

    const actionReason = (action, allowed, needsSelection = false) => {
        if (busy) return "Aguarde o processamento atual.";
        if (needsSelection && !selectedRow) return "Selecione um registro.";
        if (action === "delete" && selectedIds.length === 0) return deleteSelectionReason;
        if (!allowed) return disabledReasons[action] || "Você não possui permissão para esta ação.";
        return "";
    };

    const actionProps = (label, reason) => ({
        "aria-label": reason ? `${label}. Indisponível: ${reason}` : label,
        title: reason ? `${label}: ${reason}` : label,
        disabled: Boolean(reason)
    });

    const focusRow = (index) => {
        const row = visibleRows[Math.max(0, Math.min(index, visibleRows.length - 1))];
        if (row) rowRefs.current.get(getRowId(row))?.focus();
    };

    const handleRowKeyDown = (event, row, index, rowSelectable) => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (event.key === "ArrowDown") focusRow(index + 1);
            if (event.key === "ArrowUp") focusRow(index - 1);
            if (event.key === "Home") focusRow(0);
            if (event.key === "End") focusRow(visibleRows.length - 1);
        } else if (event.key === "Enter") {
            event.preventDefault();
            onSelect?.(getRowId(row));
            if (canView) onView?.(row);
        } else if (event.key === " " && selectable && rowSelectable) {
            event.preventDefault();
            onToggleSelect?.(getRowId(row));
        }
    };

    const builtInPagination = structuredPagination && (
        <footer className="crud-pagination" aria-label="Paginação">
            <span aria-live="polite">{paginationConfig?.label || `${totalItems} registro(s)`} · Página {effectivePage} de {totalPages}</span>
            <div className="crud-pagination-actions">
                <button type="button" disabled={effectivePage <= 1 || busy} onClick={() => paginationConfig.onPageChange?.(effectivePage - 1)}>Anterior</button>
                <button type="button" disabled={effectivePage >= totalPages || busy} onClick={() => paginationConfig.onPageChange?.(effectivePage + 1)}>Próxima</button>
            </div>
        </footer>
    );

    return (
        <section className={`crud-shell${compact ? " crud-shell--compact" : ""}${className ? ` ${className}` : ""}`}>
            <header className="crud-header">
                <div>
                    <span className="crud-kicker">{kicker}</span>
                    <h2>{title}</h2>
                    {description && <p className="crud-description">{description}</p>}
                </div>

                {onSearchChange && (
                    <label className="crud-search">
                        <span>Pesquisar</span>
                        <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar registros" />
                    </label>
                )}
            </header>

            {filters && <div className="crud-filters">{filters}</div>}

            {(showCreate || showEdit || showView || showDelete || toolbarActions) && (
                <div className="crud-toolbar" role="toolbar" aria-label="Ações do cadastro">
                    {showCreate && <button type="button" onClick={onCreate} {...actionProps("Incluir", actionReason("create", canCreate))}><FaPlus aria-hidden="true" /></button>}
                    {showEdit && <button type="button" onClick={() => selectedRow && onEdit(selectedRow)} {...actionProps("Alterar", actionReason("edit", canEdit, true))}><FaEdit aria-hidden="true" /></button>}
                    {showView && <button type="button" onClick={() => selectedRow && onView(selectedRow)} {...actionProps("Visualizar", actionReason("view", canView, true))}><FaEye aria-hidden="true" /></button>}
                    {showDelete && <button type="button" onClick={() => onDelete(selectedIds)} {...actionProps(deleteLabel, actionReason("delete", canDelete))}>{deleteIcon || <FaTrashAlt aria-hidden="true" />}</button>}
                    {toolbarActions}
                </div>
            )}

            {error && <FeedbackMessage type="error" compact action={onRetry && <button type="button" onClick={onRetry} disabled={busy}>{retryLabel}</button>}>{typeof error === "string" ? error : "Não foi possível carregar os registros."}</FeedbackMessage>}

            <div className="crud-table-wrap" aria-busy={busy}>
                {busy && <LoadingState message="Processando..." overlay />}
                <table className="crud-table">
                    <thead>
                        <tr>
                            {selectable && <th aria-label="Selecionar registros"><input type="checkbox" checked={allVisibleSelected} disabled={selectableRows.length === 0 || !onToggleSelectAll} onChange={(event) => onToggleSelectAll?.(event.target.checked, selectableRows)} /></th>}
                            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length > 0 ? visibleRows.map((row, index) => {
                            const rowId = getRowId(row);
                            const selected = rowId === selectedId;
                            const rowSelectable = isRowSelectable(row);
                            const selectionDisabledReason = rowSelectable ? "" : getRowSelectionDisabledReason(row);
                            return (
                                <tr key={rowId} ref={(element) => element ? rowRefs.current.set(rowId, element) : rowRefs.current.delete(rowId)} className={[getRowClassName(row), selected ? "selected" : ""].filter(Boolean).join(" ")} aria-selected={selected} onClick={() => onSelect?.(rowId)} onDoubleClick={() => canView && onView?.(row)} onKeyDown={(event) => handleRowKeyDown(event, row, index, rowSelectable)} tabIndex={selected || (!selectedId && index === 0) ? 0 : -1}>
                                    {selectable && <td><input type="checkbox" checked={selectedIdSet.has(rowId)} aria-label={selectionDisabledReason ? `Selecionar ${getRowLabel(row)}. Indisponível: ${selectionDisabledReason}` : `Selecionar ${getRowLabel(row)}`} title={selectionDisabledReason || undefined} disabled={!rowSelectable} onClick={(event) => event.stopPropagation()} onChange={() => rowSelectable && onToggleSelect?.(rowId)} /></td>}
                                    {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
                                </tr>
                            );
                        }) : <tr><td className="crud-empty" colSpan={columns.length + (selectable ? 1 : 0)}><EmptyState title={emptyMessage} compact /></td></tr>}
                    </tbody>
                </table>
            </div>

            {pagination && <footer className="crud-pagination">{pagination}</footer>}
            {builtInPagination}
        </section>
    );
}
