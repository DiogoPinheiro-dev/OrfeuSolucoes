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

const normalizeHexColor = (value) => {
    const hex = String(value || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) return hex.split("").map((character) => character + character).join("");
    return /^[0-9a-f]{6}$/i.test(hex) ? hex : null;
};

export const chamadoBadgeColorStyle = (backgroundColor) => {
    const hex = normalizeHexColor(backgroundColor);
    if (!hex) return undefined;
    const [red, green, blue] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
    const toLinear = (channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
    const contrastWithDark = (luminance + 0.05) / 0.05;
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const useDarkText = contrastWithDark >= contrastWithWhite;
    return {
        backgroundColor: `#${hex}`,
        borderColor: useDarkText ? "rgba(15, 23, 42, 0.42)" : `#${hex}`,
        color: useDarkText ? "#000000" : "#ffffff"
    };
};

export const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
};

export const chamadoSlaDeadline = (chamado) => {
    if (!chamado) {
        return null;
    }

    return chamado.primeiraRespostaEm
        ? chamado.resolucaoLimiteEm || null
        : chamado.primeiraRespostaLimiteEm || chamado.resolucaoLimiteEm || null;
};
