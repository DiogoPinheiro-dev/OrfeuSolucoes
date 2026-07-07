export const statusOptions = [
    { value: "", label: "Todos" },
    { value: "ABERTO", label: "Aberto" },
    { value: "EM_TRIAGEM", label: "Em triagem" },
    { value: "EM_ATENDIMENTO", label: "Em atendimento" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "RESOLVIDO", label: "Resolvido" },
    { value: "ARQUIVADO", label: "Arquivado" }
];

export const kanbanStatusOptions = statusOptions.filter((option) =>
    option.value && option.value !== "ARQUIVADO"
);

export const kanbanFilterStatusOptions = [
    statusOptions[0],
    ...kanbanStatusOptions
];

export const archivedKanbanStatusOptions = statusOptions.filter((option) =>
    option.value === "ARQUIVADO"
);

export const editableStatusOptions = [
    { value: "EM_TRIAGEM", label: "Em triagem" },
    { value: "EM_ATENDIMENTO", label: "Em atendimento" },
    { value: "PENDENTE", label: "Pendente" }
];

export const statusLabel = (value) =>
    statusOptions.find((option) => option.value === value)?.label || value || "-";

export const statusClassName = (value) => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    return `chamado-status chamado-status-${normalized || "sem-status"}`;
};

export const prioridadeLabel = (value) => value || "-";

export const prioridadeClassName = (value) => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    return `chamado-prioridade chamado-prioridade-${normalized || "sem-prioridade"}`;
};

export const tipoClassName = (value) => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    return `chamado-tipo chamado-tipo-${normalized || "sem-tipo"}`;
};

export const tipoLabel = (value) => value || "-";

export const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
};
