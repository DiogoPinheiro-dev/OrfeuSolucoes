export const statusOptions = [
    { value: "", label: "Todos" },
    { value: "ABERTO", label: "Aberto" },
    { value: "EM_TRIAGEM", label: "Em triagem" },
    { value: "EM_ATENDIMENTO", label: "Em atendimento" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "RESOLVIDO", label: "Resolvido" },
    { value: "ENCERRADO", label: "Encerrado" }
];

export const editableStatusOptions = [
    { value: "EM_TRIAGEM", label: "Em triagem" },
    { value: "EM_ATENDIMENTO", label: "Em atendimento" },
    { value: "PENDENTE", label: "Pendente" }
];

export const prioridadeOptions = [
    { value: "", label: "Todas" },
    { value: "BAIXA", label: "Baixa" },
    { value: "MEDIA", label: "Media" },
    { value: "ALTA", label: "Alta" },
    { value: "URGENTE", label: "Urgente" }
];

export const prioridadeEditOptions = prioridadeOptions.filter((option) => option.value);

export const tipoOptions = [
    { value: "SOLICITACAO", label: "Solicitacao" },
    { value: "INCIDENTE", label: "Incidente" },
    { value: "DUVIDA", label: "Duvida" },
    { value: "MELHORIA", label: "Melhoria" }
];

export const statusLabel = (value) =>
    statusOptions.find((option) => option.value === value)?.label || value || "-";

export const statusClassName = (value) => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    return `chamado-status chamado-status-${normalized || "sem-status"}`;
};

export const prioridadeLabel = (value) =>
    prioridadeOptions.find((option) => option.value === value)?.label || value || "-";

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

export const tipoLabel = (value) =>
    tipoOptions.find((option) => option.value === value)?.label || value || "-";

export const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
};
