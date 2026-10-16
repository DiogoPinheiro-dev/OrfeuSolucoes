// Filtros por campo do CrudGrid. A coluna declara `filter` e a grade monta os controles e filtra as linhas.

const EMPTY_FILTER_VALUE = "__vazio__";
const BOOLEAN_FILTER_OPTIONS = [{ value: "true", label: "Sim" }, { value: "false", label: "Não" }];

const normalizeText = (value) => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Filtro de situação com rótulos próprios, para colunas que mostram "Ativo/Inativo" em vez de "Sim/Não". */
export const statusFilter = ({ active = "Ativo", inactive = "Inativo" } = {}) => ({
    type: "boolean",
    allLabel: "Todas",
    options: [{ value: "true", label: active }, { value: "false", label: inactive }]
});

/**
 * Filtro declarado pela coluna: "boolean", "select" (opções informadas ou extraídas das linhas) ou "text".
 * `value(row)` define o valor comparado; sem ele, usa `row[column.key]`.
 */
export const columnFilterOf = (column) => {
    if (!column.filter) return null;
    const filter = typeof column.filter === "string" ? { type: column.filter } : column.filter;
    return { label: column.label, allLabel: "Todos", ...filter, key: column.key };
};

const filterValueOf = (filter, row) => (filter.value ? filter.value(row) : row[filter.key]);

const selectValueOf = (filter, row) => {
    const value = filterValueOf(filter, row);
    return value === null || value === undefined || value === "" ? EMPTY_FILTER_VALUE : String(value);
};

export const filterOptionsOf = (filter, rows) => {
    if (filter.options) return filter.options;
    if (filter.type === "boolean") return BOOLEAN_FILTER_OPTIONS;
    const values = new Set(rows.map((row) => selectValueOf(filter, row)));
    const options = [...values]
        .filter((value) => value !== EMPTY_FILTER_VALUE)
        .sort((left, right) => left.localeCompare(right, "pt-BR"))
        .map((value) => ({ value, label: value }));
    return values.has(EMPTY_FILTER_VALUE) ? [...options, { value: EMPTY_FILTER_VALUE, label: filter.emptyLabel || "Não informado" }] : options;
};

export const matchesFilter = (filter, row, selected) => {
    if (filter.type === "text") return normalizeText(filterValueOf(filter, row)).includes(normalizeText(selected));
    if (filter.type === "boolean") return String(Boolean(filterValueOf(filter, row))) === selected;
    return selectValueOf(filter, row) === selected;
};
