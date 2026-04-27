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
    getRowId = (row) => row.id
}) {
    const selectedRow = rows.find((row) => getRowId(row) === selectedId);

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
                <button type="button" onClick={onCreate}>+ Incluir</button>
                <button type="button" onClick={() => selectedRow && onEdit(selectedRow)} disabled={!selectedRow}>
                    Alterar
                </button>
                <button type="button" onClick={() => selectedRow && onView(selectedRow)} disabled={!selectedRow}>
                    Visualizar
                </button>
                <button type="button" onClick={() => selectedRow && onDelete(selectedRow)} disabled={!selectedRow}>
                    Deletar
                </button>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th aria-label="Status"></th>
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
                                            <span className="crud-status-dot" aria-hidden="true"></span>
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
