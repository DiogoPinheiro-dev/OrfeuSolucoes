import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaEdit, FaEye, FaPlus, FaTrashAlt } from "react-icons/fa";

import { EmptyState, FeedbackMessage, LoadingState } from "./CrudFeedback";
import { columnFilterOf, filterOptionsOf, matchesFilter } from "../utils/crudFilters";
import { actionAvailabilityProps, tooltipProps } from "../utils/tooltip";
import "../styles/crudGrid.css";

export const CRUD_PAGE_SIZE = 5;

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
    paginationResetKey,
    toolbarActions,
    toolbarLabel = "Ações do cadastro",
    actionLabels = {},
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
    const previousResetKey = useRef(paginationResetKey);
    const previousSearch = useRef(search);
    const previousColumnFilterKey = useRef("");
    const [localPage, setLocalPage] = useState(1);
    const [columnFilterValues, setColumnFilterValues] = useState({});
    const structuredPagination = !pagination;
    const paginationMode = paginationConfig?.mode || "local";
    const columnFilters = paginationMode === "local" ? columns.map(columnFilterOf).filter(Boolean) : [];
    const activeColumnFilters = columnFilters.filter((filter) => columnFilterValues[filter.key]);
    const columnFilterKey = activeColumnFilters.map((filter) => `${filter.key}=${columnFilterValues[filter.key]}`).join("|");
    const filteredRows = activeColumnFilters.length
        ? rows.filter((row) => activeColumnFilters.every((filter) => matchesFilter(filter, row, columnFilterValues[filter.key])))
        : rows;
    const controlledPage = paginationConfig?.page;
    const currentPage = Math.max(1, controlledPage || localPage);
    const pageSize = Math.min(CRUD_PAGE_SIZE, Math.max(1, paginationConfig?.pageSize || CRUD_PAGE_SIZE));
    const totalItems = paginationMode === "local" ? filteredRows.length : Math.max(0, paginationConfig?.totalItems ?? rows.length);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const visibleRows = useMemo(() => {
        if (!structuredPagination || paginationMode !== "local") return filteredRows;
        const start = (Math.min(currentPage, totalPages) - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [currentPage, pageSize, paginationMode, filteredRows, structuredPagination, totalPages]);
    const selectedRow = filteredRows.find((row) => getRowId(row) === selectedId);
    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const selectableRows = visibleRows.filter((row) => isRowSelectable(row));
    const allVisibleSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIdSet.has(getRowId(row)));
    const effectivePage = Math.min(currentPage, totalPages);

    const clearSelection = useCallback(() => {
        onSelect?.(null);
        const selectedVisibleRows = visibleRows.filter((row) => selectedIdSet.has(getRowId(row)));
        if (selectedVisibleRows.length) onToggleSelectAll?.(false, selectedVisibleRows);
    }, [getRowId, onSelect, onToggleSelectAll, selectedIdSet, visibleRows]);

    const changePage = (nextPage) => {
        const validPage = Math.max(1, Math.min(nextPage, totalPages));
        if (validPage === effectivePage) return;
        clearSelection();
        if (controlledPage == null) setLocalPage(validPage);
        paginationConfig?.onPageChange?.(validPage);
    };

    useEffect(() => {
        if (currentPage <= totalPages) return;
        clearSelection();
        if (controlledPage == null) setLocalPage(totalPages);
        paginationConfig?.onPageChange?.(totalPages);
    }, [clearSelection, controlledPage, currentPage, paginationConfig, totalPages]);

    useEffect(() => {
        const searchChanged = previousSearch.current !== search;
        const resetKeyChanged = previousResetKey.current !== paginationResetKey;
        const columnFiltersChanged = previousColumnFilterKey.current !== columnFilterKey;
        previousSearch.current = search;
        previousResetKey.current = paginationResetKey;
        previousColumnFilterKey.current = columnFilterKey;
        if (!searchChanged && !resetKeyChanged && !columnFiltersChanged) return;
        clearSelection();
        if (controlledPage == null) setLocalPage(1);
        if (effectivePage !== 1) paginationConfig?.onPageChange?.(1);
    }, [clearSelection, columnFilterKey, controlledPage, effectivePage, paginationConfig, paginationResetKey, search]);

    const changeColumnFilter = (key, value) => setColumnFilterValues((current) => ({ ...current, [key]: value }));

    const actionReason = (action, allowed, needsSelection = false) => {
        if (busy) return "Aguarde o processamento atual.";
        if (needsSelection && !selectedRow) return "Selecione um registro.";
        if (action === "delete" && selectedIds.length === 0) return deleteSelectionReason;
        if (!allowed) return disabledReasons[action] || "Você não possui permissão para esta ação.";
        return "";
    };

    const actionProps = actionAvailabilityProps;

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
                <button type="button" disabled={effectivePage <= 1 || busy} onClick={() => changePage(effectivePage - 1)}>Anterior</button>
                <button type="button" disabled={effectivePage >= totalPages || busy} onClick={() => changePage(effectivePage + 1)}>Próxima</button>
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

            {(columnFilters.length > 0 || filters) && (
                <div className="crud-filters">
                    {columnFilters.map((filter) => (
                        <label key={filter.key} className="crud-field-filter">
                            {filter.label}
                            {filter.type === "text" ? (
                                <input type="search" value={columnFilterValues[filter.key] || ""} placeholder={filter.placeholder || "Filtrar"} onChange={(event) => changeColumnFilter(filter.key, event.target.value)} />
                            ) : (
                                <select value={columnFilterValues[filter.key] || ""} onChange={(event) => changeColumnFilter(filter.key, event.target.value)}>
                                    <option value="">{filter.allLabel}</option>
                                    {filterOptionsOf(filter, rows).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            )}
                        </label>
                    ))}
                    {filters}
                    {activeColumnFilters.length > 0 && <button type="button" className="crud-filters-clear" onClick={() => setColumnFilterValues({})}>Limpar filtros</button>}
                </div>
            )}

            {(showCreate || showEdit || showView || showDelete || toolbarActions) && (
                <div className="crud-toolbar" role="toolbar" aria-label={toolbarLabel}>
                    {showCreate && <button type="button" onClick={onCreate} {...actionProps(actionLabels.create || "Incluir", actionReason("create", canCreate))}><FaPlus aria-hidden="true" /></button>}
                    {showEdit && <button type="button" onClick={() => selectedRow && onEdit(selectedRow)} {...actionProps(actionLabels.edit || "Alterar", actionReason("edit", canEdit, true))}><FaEdit aria-hidden="true" /></button>}
                    {showView && <button type="button" onClick={() => selectedRow && onView(selectedRow)} {...actionProps(actionLabels.view || "Visualizar", actionReason("view", canView, true))}><FaEye aria-hidden="true" /></button>}
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
                                    {selectable && <td><input type="checkbox" checked={selectedIdSet.has(rowId)} aria-label={selectionDisabledReason ? `Selecionar ${getRowLabel(row)}. Indisponível: ${selectionDisabledReason}` : `Selecionar ${getRowLabel(row)}`} {...tooltipProps(selectionDisabledReason)} disabled={!rowSelectable} onClick={(event) => event.stopPropagation()} onChange={() => rowSelectable && onToggleSelect?.(rowId)} /></td>}
                                    {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
                                </tr>
                            );
                        }) : <tr><td className="crud-empty" colSpan={columns.length + (selectable ? 1 : 0)}><EmptyState title={rows.length > 0 && activeColumnFilters.length > 0 ? "Nenhum registro corresponde aos filtros." : emptyMessage} compact /></td></tr>}
                    </tbody>
                </table>
            </div>

            {pagination && <footer className="crud-pagination">{pagination}</footer>}
            {builtInPagination}
        </section>
    );
}
