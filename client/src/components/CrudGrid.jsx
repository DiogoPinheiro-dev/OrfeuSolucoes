import { FaEdit, FaEye, FaPlus, FaTrashAlt } from "react-icons/fa";

import "../styles/crudGrid.css";

export default function CrudGrid({
    title,
    columns,
    rows,
    selectedId,
    onSelect,
    onCreate,
    onEdit,
    onView,
    onDelete,
    search,
    onSearchChange,
    selectedIds = [],
    onToggleSelect,
    onToggleSelectAll,
    getRowId = (row) => row.id
}) {
    const selectedRow = rows.find((row) => getRowId(row) === selectedId);
    const selectedIdSet = new Set(selectedIds);
    const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIdSet.has(getRowId(row)));

    return (
        <section className="crud-shell">
            <header className="crud-header">
                <div>
                    <span className="crud-kicker">Configurador</span>
                    <h2>{title}</h2>
                </div>

                <label className="crud-search">
                    <span>Pesquisar</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Buscar registros"
                    />
                </label>
            </header>

            <div className="crud-toolbar" aria-label="Acoes do cadastro">
                <button type="button" onClick={onCreate} aria-label="Incluir" title="Incluir">
                    <FaPlus aria-hidden="true" />
                </button>
                <button type="button" onClick={() => selectedRow && onEdit(selectedRow)} disabled={!selectedRow} aria-label="Alterar" title="Alterar">
                    <FaEdit aria-hidden="true" />
                </button>
                <button type="button" onClick={() => selectedRow && onView(selectedRow)} disabled={!selectedRow} aria-label="Visualizar" title="Visualizar">
                    <FaEye aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onDelete(selectedIds)} disabled={selectedIds.length === 0} aria-label="Deletar selecionados" title="Deletar selecionados">
                    <FaTrashAlt aria-hidden="true" />
                </button>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th aria-label="Selecionar registros">
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    disabled={rows.length === 0 || !onToggleSelectAll}
                                    onChange={(event) => onToggleSelectAll?.(event.target.checked, rows)}
                                />
                            </th>
                            {columns.map((column) => (
                                <th key={column.key}>{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length > 0 ? (
                            rows.map((row) => {
                                const rowId = getRowId(row);
                                const selected = rowId === selectedId;

                                return (
                                    <tr
                                        key={rowId}
                                        className={selected ? "selected" : ""}
                                        onClick={() => onSelect(rowId)}
                                        onDoubleClick={() => onView(row)}
                                        tabIndex={0}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIdSet.has(rowId)}
                                                aria-label={`Selecionar ${row.nome || row.email || "registro"}`}
                                                onClick={(event) => event.stopPropagation()}
                                                onChange={() => onToggleSelect?.(rowId)}
                                            />
                                        </td>
                                        {columns.map((column) => (
                                            <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td className="crud-empty" colSpan={columns.length + 1}>
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
