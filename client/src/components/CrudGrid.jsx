import { FaEdit, FaEye, FaPlus, FaTrashAlt } from "react-icons/fa";

import "../styles/crudGrid.css";

export default function CrudGrid({
    title,
    kicker = "Configurador",
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
    emptyMessage = "Nenhum registro encontrado.",
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
    selectable = true,
    isRowSelectable = () => true,
    getRowId = (row) => row.id
}) {
    const selectedRow = rows.find((row) => getRowId(row) === selectedId);
    const selectedIdSet = new Set(selectedIds);
    const selectableRows = rows.filter((row) => isRowSelectable(row));
    const allVisibleSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIdSet.has(getRowId(row)));

    return (
        <section className="crud-shell">
            <header className="crud-header">
                <div>
                    <span className="crud-kicker">{kicker}</span>
                    <h2>{title}</h2>
                </div>

                {onSearchChange && (
                    <label className="crud-search">
                        <span>Pesquisar</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Buscar registros"
                        />
                    </label>
                )}
            </header>

            {filters && <div className="crud-filters">{filters}</div>}

            {(showCreate || showEdit || showView || showDelete) && (
                <div className="crud-toolbar" aria-label="Ações do cadastro">
                    {showCreate && <button type="button" onClick={onCreate} disabled={!canCreate} aria-label="Incluir" title="Incluir"><FaPlus aria-hidden="true" /></button>}
                    {showEdit && <button type="button" onClick={() => selectedRow && onEdit(selectedRow)} disabled={!selectedRow || !canEdit} aria-label="Alterar" title="Alterar"><FaEdit aria-hidden="true" /></button>}
                    {showView && <button type="button" onClick={() => selectedRow && onView(selectedRow)} disabled={!selectedRow || !canView} aria-label="Visualizar" title="Visualizar"><FaEye aria-hidden="true" /></button>}
                    {showDelete && <button type="button" onClick={() => onDelete(selectedIds)} disabled={selectedIds.length === 0 || !canDelete} aria-label="Deletar selecionados" title="Deletar selecionados"><FaTrashAlt aria-hidden="true" /></button>}
                </div>
            )}

            <div className="crud-table-wrap">
                {busy && (
                    <div className="crud-grid-loading" role="status" aria-live="polite">
                        <span aria-hidden="true"></span>
                        <p>Processando...</p>
                    </div>
                )}
                <table className="crud-table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th aria-label="Selecionar registros">
                                    <input type="checkbox" checked={allVisibleSelected} disabled={selectableRows.length === 0 || !onToggleSelectAll} onChange={(event) => onToggleSelectAll?.(event.target.checked, selectableRows)} />
                                </th>
                            )}
                            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length > 0 ? rows.map((row) => {
                            const rowId = getRowId(row);
                            const selected = rowId === selectedId;
                            const rowSelectable = isRowSelectable(row);

                            return (
                                <tr key={rowId} className={selected ? "selected" : ""} onClick={() => onSelect(rowId)} onDoubleClick={() => canView && onView?.(row)} tabIndex={0}>
                                    {selectable && (
                                        <td>
                                            <input type="checkbox" checked={selectedIdSet.has(rowId)} aria-label={`Selecionar ${row.nome || row.email || "registro"}`} disabled={!rowSelectable} onClick={(event) => event.stopPropagation()} onChange={() => rowSelectable && onToggleSelect?.(rowId)} />
                                        </td>
                                    )}
                                    {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
                                </tr>
                            );
                        }) : (
                            <tr><td className="crud-empty" colSpan={columns.length + (selectable ? 1 : 0)}>{emptyMessage}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && <footer className="crud-pagination">{pagination}</footer>}
        </section>
    );
}
