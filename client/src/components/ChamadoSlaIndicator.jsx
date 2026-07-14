import { formatDateTime } from "./chamadoLabels";

const SLA_LABELS = {
    NO_PRAZO: "No prazo",
    PERTO_DO_VENCIMENTO: "Perto do vencimento",
    ATRASADO: "Atrasado",
    PAUSADO: "Pausado",
    SEM_SLA: "Sem SLA"
};

export const chamadoSlaDeadline = (chamado) => {
    if (!chamado) return null;
    return chamado.primeiraRespostaEm
        ? chamado.resolucaoLimiteEm || null
        : chamado.primeiraRespostaLimiteEm || chamado.resolucaoLimiteEm || null;
};

export default function ChamadoSlaIndicator({ chamado, showWithoutSla = false, detailed = false }) {
    const status = chamado?.slaStatus || "SEM_SLA";

    if (status === "SEM_SLA" && !showWithoutSla) {
        return null;
    }

    const primeiraResposta = chamado?.primeiraRespostaLimiteEm
        ? formatDateTime(chamado.primeiraRespostaLimiteEm)
        : "Nao configurado";
    const resolucao = chamado?.resolucaoLimiteEm
        ? formatDateTime(chamado.resolucaoLimiteEm)
        : "Nao configurado";
    const tooltip = "Primeira resposta: " + primeiraResposta + ". Resolucao: " + resolucao + ".";
    const deadline = chamadoSlaDeadline(chamado);

    return (
        <span
            className={"chamado-sla chamado-sla-" + status.toLowerCase()}
            title={tooltip}
            aria-label={"SLA " + (SLA_LABELS[status] || status) + ". " + tooltip}
        >
            <span className="chamado-sla-dot" aria-hidden="true" />
            <span>{SLA_LABELS[status] || status}</span>
            {detailed && deadline && status !== "PAUSADO" && (
                <small>Vence em {formatDateTime(deadline)}</small>
            )}
        </span>
    );
}